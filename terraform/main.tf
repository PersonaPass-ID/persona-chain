# PersonaChain Production Infrastructure
# Terraform configuration for AWS deployment with security hardening

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "PersonaChain"
      Environment = "production"
      ManagedBy   = "terraform"
      Owner       = "PersonaPass-ID"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "key_name" {
  description = "AWS key pair name for EC2 instances"
  type        = string
  default     = "persona-keypair"
}

variable "validator_instance_type" {
  description = "EC2 instance type for validators"
  type        = string
  default     = "t3.medium"
}

variable "chain_id" {
  description = "PersonaChain chain ID"
  type        = string
  default     = "personachain-1"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-22.04-amd64-server-*"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC Configuration
resource "aws_vpc" "personachain_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "personachain-vpc"
  }
}

resource "aws_internet_gateway" "personachain_igw" {
  vpc_id = aws_vpc.personachain_vpc.id
  
  tags = {
    Name = "personachain-igw"
  }
}

resource "aws_subnet" "personachain_subnet" {
  count = 2
  
  vpc_id                  = aws_vpc.personachain_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "personachain-subnet-${count.index + 1}"
  }
}

resource "aws_route_table" "personachain_rt" {
  vpc_id = aws_vpc.personachain_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.personachain_igw.id
  }
  
  tags = {
    Name = "personachain-rt"
  }
}

resource "aws_route_table_association" "personachain_rta" {
  count = 2
  
  subnet_id      = aws_subnet.personachain_subnet[count.index].id
  route_table_id = aws_route_table.personachain_rt.id
}

# Security Groups
resource "aws_security_group" "personachain_validator" {
  name_prefix = "personachain-validator-"
  vpc_id      = aws_vpc.personachain_vpc.id
  
  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Tendermint RPC (HTTPS only)
  ingress {
    from_port   = 26657
    to_port     = 26657
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Tendermint P2P
  ingress {
    from_port   = 26656
    to_port     = 26656
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Prometheus monitoring
  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  # Grafana dashboard
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  # Node exporter
  ingress {
    from_port   = 9100
    to_port     = 9100
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "personachain-validator-sg"
  }
}

# Load Balancer Security Group
resource "aws_security_group" "personachain_lb" {
  name_prefix = "personachain-lb-"
  vpc_id      = aws_vpc.personachain_vpc.id
  
  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # HTTP redirect
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "personachain-lb-sg"
  }
}

# EC2 Instances for Validators
resource "aws_instance" "personachain_validator" {
  ami                     = data.aws_ami.ubuntu.id
  instance_type           = var.validator_instance_type
  key_name                = var.key_name
  vpc_security_group_ids  = [aws_security_group.personachain_validator.id]
  subnet_id               = aws_subnet.personachain_subnet[0].id
  
  root_block_device {
    volume_type = "gp3"
    volume_size = 100
    encrypted   = true
    
    tags = {
      Name = "personachain-validator-root"
    }
  }
  
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    chain_id = var.chain_id
    moniker  = "personachain-validator-1"
  }))
  
  tags = {
    Name = "personachain-validator-1"
    Type = "validator"
  }
}

# Application Load Balancer
resource "aws_lb" "personachain_rpc" {
  name               = "personachain-rpc-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.personachain_lb.id]
  subnets            = aws_subnet.personachain_subnet[*].id
  
  enable_deletion_protection = false
  
  tags = {
    Name = "personachain-rpc-lb"
  }
}

# Target Group
resource "aws_lb_target_group" "personachain_rpc" {
  name     = "personachain-rpc-tg"
  port     = 26657
  protocol = "HTTP"
  vpc_id   = aws_vpc.personachain_vpc.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 10
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }
  
  tags = {
    Name = "personachain-rpc-tg"
  }
}

resource "aws_lb_target_group_attachment" "personachain_validator" {
  target_group_arn = aws_lb_target_group.personachain_rpc.arn
  target_id        = aws_instance.personachain_validator.id
  port             = 26657
}

# Load Balancer Listeners
resource "aws_lb_listener" "personachain_https" {
  load_balancer_arn = aws_lb.personachain_rpc.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.personachain_cert.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.personachain_rpc.arn
  }
}

resource "aws_lb_listener" "personachain_http" {
  load_balancer_arn = aws_lb.personachain_rpc.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Outputs
output "validator_ip" {
  description = "Public IP of validator instance"
  value       = aws_instance.personachain_validator.public_ip
}

output "load_balancer_dns" {
  description = "Load balancer DNS name"
  value       = aws_lb.personachain_rpc.dns_name
}

output "rpc_endpoint" {
  description = "HTTPS RPC endpoint"
  value       = "https://${aws_lb.personachain_rpc.dns_name}"
}

output "chain_id" {
  description = "PersonaChain chain ID"
  value       = var.chain_id
}