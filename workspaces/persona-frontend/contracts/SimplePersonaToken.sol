// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SimplePersonaToken (PID)
 * @dev Simplified PersonaID token for initial deployment
 * 
 * Key Features:
 * - ERC20 token with permit functionality
 * - Basic staking mechanism with rewards
 * - Identity verification rewards
 * - Role-based access control
 */
contract SimplePersonaToken is 
    ERC20, 
    ERC20Permit, 
    ReentrancyGuard, 
    Pausable, 
    AccessControl 
{
    // ============================================
    // ROLES
    // ============================================
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============================================
    // EVENTS
    // ============================================
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 amount);
    event VerificationReward(address indexed user, uint256 amount, string verificationType);

    // ============================================
    // STRUCTS
    // ============================================
    
    struct StakeInfo {
        uint256 amount;                 
        uint256 timestamp;              
        uint256 rewardRate;             
        uint256 claimedRewards;         
    }

    // ============================================
    // STATE VARIABLES
    // ============================================
    
    // Token configuration
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100M initial
    
    // Staking
    mapping(address => StakeInfo[]) public userStakes;
    mapping(address => uint256) public totalStaked;
    uint256 public totalStakedAmount;
    
    // Rewards
    mapping(address => uint256) public pendingRewards;
    mapping(address => uint256) public lifetimeRewards;
    uint256 public totalRewardsDistributed;
    
    // Configuration
    uint256 public baseStakingRate = 800;           // 8% annual base rate
    uint256 public verificationReward = 10 * 10**18; // 10 PID per verification
    uint256 public monthlyKYCReward = 100 * 10**18;  // 100 PID monthly KYC reward
    
    // Verification tracking
    mapping(address => uint256) public verificationCount;
    mapping(address => uint256) public lastKYCReward;
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() 
        ERC20("PersonaID Token", "PID") 
        ERC20Permit("PersonaID Token")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        // Mint initial supply
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // ============================================
    // STAKING FUNCTIONS
    // ============================================
    
    function stake(uint256 _amount) external whenNotPaused nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), _amount);
        
        // Create stake
        userStakes[msg.sender].push(StakeInfo({
            amount: _amount,
            timestamp: block.timestamp,
            rewardRate: baseStakingRate,
            claimedRewards: 0
        }));
        
        totalStaked[msg.sender] += _amount;
        totalStakedAmount += _amount;
        
        emit Staked(msg.sender, _amount, block.timestamp);
    }
    
    function unstake(uint256 _stakeIndex) external whenNotPaused nonReentrant {
        require(_stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        
        StakeInfo storage stakeInfo = userStakes[msg.sender][_stakeIndex];
        uint256 stakedAmount = stakeInfo.amount;
        uint256 rewards = calculateStakingRewards(msg.sender, _stakeIndex);
        
        // Remove stake
        userStakes[msg.sender][_stakeIndex] = userStakes[msg.sender][userStakes[msg.sender].length - 1];
        userStakes[msg.sender].pop();
        
        totalStaked[msg.sender] -= stakedAmount;
        totalStakedAmount -= stakedAmount;
        
        // Transfer staked tokens back
        _transfer(address(this), msg.sender, stakedAmount);
        
        // Distribute rewards
        if (rewards > 0) {
            _distributeRewards(msg.sender, rewards);
        }
        
        emit Unstaked(msg.sender, stakedAmount, rewards);
    }

    // ============================================
    // VERIFICATION REWARD FUNCTIONS
    // ============================================
    
    function distributeVerificationReward(
        address _user,
        string calldata _verificationType
    ) external onlyRole(VERIFIER_ROLE) {
        verificationCount[_user]++;
        
        uint256 reward = verificationReward;
        
        // Double reward for first-time verifiers
        if (verificationCount[_user] == 1) {
            reward = reward * 2;
        }
        
        _distributeRewards(_user, reward);
        
        emit VerificationReward(_user, reward, _verificationType);
    }
    
    function distributeMonthlyKYCReward(address _user) external onlyRole(VERIFIER_ROLE) {
        require(
            block.timestamp > lastKYCReward[_user] + 30 days,
            "Monthly reward already claimed"
        );
        
        lastKYCReward[_user] = block.timestamp;
        _distributeRewards(_user, monthlyKYCReward);
        
        emit VerificationReward(_user, monthlyKYCReward, "Monthly KYC");
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    function calculateStakingRewards(address _user, uint256 _stakeIndex) 
        public 
        view 
        returns (uint256) 
    {
        if (_stakeIndex >= userStakes[_user].length) return 0;
        
        StakeInfo memory stakeInfo = userStakes[_user][_stakeIndex];
        
        uint256 stakingTime = block.timestamp - stakeInfo.timestamp;
        uint256 annualReward = (stakeInfo.amount * stakeInfo.rewardRate) / 10000;
        uint256 timeReward = (annualReward * stakingTime) / 365 days;
        
        return timeReward - stakeInfo.claimedRewards;
    }
    
    function getTotalStaked(address _user) external view returns (uint256) {
        return totalStaked[_user];
    }
    
    function getStakeCount(address _user) external view returns (uint256) {
        return userStakes[_user].length;
    }
    
    function getTotalPendingRewards(address _user) external view returns (uint256) {
        uint256 total = pendingRewards[_user];
        
        for (uint256 i = 0; i < userStakes[_user].length; i++) {
            total += calculateStakingRewards(_user, i);
        }
        
        return total;
    }
    
    function canClaimMonthlyKYC(address _user) external view returns (bool) {
        return block.timestamp > lastKYCReward[_user] + 30 days;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    function updateRewardConfig(
        uint256 _baseStakingRate,
        uint256 _verificationReward,
        uint256 _monthlyKYCReward
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseStakingRate = _baseStakingRate;
        verificationReward = _verificationReward;
        monthlyKYCReward = _monthlyKYCReward;
    }
    
    function mintRewards(address _to, uint256 _amount) external onlyRole(REWARD_MANAGER_ROLE) {
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(_to, _amount);
    }
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================
    
    function _distributeRewards(address _to, uint256 _amount) internal {
        if (totalSupply() + _amount <= MAX_SUPPLY) {
            _mint(_to, _amount);
        } else {
            pendingRewards[_to] += _amount;
        }
        
        lifetimeRewards[_to] += _amount;
        totalRewardsDistributed += _amount;
    }
    
    // Override _update for pause functionality
    function _update(address from, address to, uint256 value) internal virtual override whenNotPaused {
        super._update(from, to, value);
    }
}