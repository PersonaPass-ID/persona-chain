# PersonaPass.xyz Validator Infrastructure
# Complete deployment for PersonaPass validator ecosystem

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "domain" {
  description = "Base domain for PersonaPass services"
  type        = string
  default     = "personapass.xyz"
}

variable "validator_count" {
  description = "Number of validator nodes"
  type        = number
  default     = 3
}

variable "sentry_count" {
  description = "Number of sentry nodes"
  type        = number
  default     = 5
}

variable "environment" {
  description = "Environment (prod, staging, dev)"
  type        = string
  default     = "prod"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# data "aws_route53_zone" "main" {
#   name = var.domain
# }

# VPC Configuration
resource "aws_vpc" "personapass_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "personapass-${var.environment}-vpc"
    Environment = var.environment
    Project     = "PersonaPass"
  }
}

resource "aws_internet_gateway" "personapass_igw" {
  vpc_id = aws_vpc.personapass_vpc.id

  tags = {
    Name        = "personapass-${var.environment}-igw"
    Environment = var.environment
  }
}

# Public Subnets for Validators
resource "aws_subnet" "public_subnets" {
  count = min(length(data.aws_availability_zones.available.names), 3)

  vpc_id                  = aws_vpc.personapass_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "personapass-${var.environment}-public-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
  }
}

# Private Subnets for Internal Services
resource "aws_subnet" "private_subnets" {
  count = min(length(data.aws_availability_zones.available.names), 3)

  vpc_id            = aws_vpc.personapass_vpc.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "personapass-${var.environment}-private-${count.index + 1}"
    Environment = var.environment
    Type        = "private"
  }
}

# Route Tables
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.personapass_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.personapass_igw.id
  }

  tags = {
    Name        = "personapass-${var.environment}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public_rta" {
  count = length(aws_subnet.public_subnets)

  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
resource "aws_security_group" "validator_sg" {
  name        = "personapass-validator-sg"
  description = "Security group for PersonaPass validators"
  vpc_id      = aws_vpc.personapass_vpc.id

  # Tendermint P2P
  ingress {
    from_port   = 26656
    to_port     = 26656
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Tendermint RPC
  ingress {
    from_port   = 26657
    to_port     = 26657
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Cosmos REST API
  ingress {
    from_port   = 1317
    to_port     = 1317
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # GRPC
  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus monitoring
  ingress {
    from_port   = 26660
    to_port     = 26660
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.personapass_vpc.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "personapass-validator-sg"
    Environment = var.environment
  }
}

# Validator Instances
resource "aws_instance" "validators" {
  count = var.validator_count

  ami           = "ami-0c02fb55956c7d316" # Amazon Linux 2 AMI
  instance_type = "t3.large"             # 2 vCPUs, 8 GB RAM for validators
  key_name      = aws_key_pair.validator_key.key_name

  subnet_id                   = aws_subnet.public_subnets[count.index % length(aws_subnet.public_subnets)].id
  vpc_security_group_ids      = [aws_security_group.validator_sg.id]
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 500 # 500GB for blockchain data
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/scripts/validator-init.sh", {
    validator_index = count.index + 1
    domain         = var.domain
    environment    = var.environment
  }))

  tags = {
    Name        = "personapass-validator-${count.index + 1}"
    Environment = var.environment
    Type        = "validator"
    Role        = "validator"
  }
}

# Sentry Nodes
resource "aws_instance" "sentry_nodes" {
  count = var.sentry_count

  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.medium" # 2 vCPUs, 4 GB RAM for sentry nodes
  key_name      = aws_key_pair.validator_key.key_name

  subnet_id                   = aws_subnet.public_subnets[count.index % length(aws_subnet.public_subnets)].id
  vpc_security_group_ids      = [aws_security_group.validator_sg.id]
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 200 # 200GB for sentry nodes
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/scripts/sentry-init.sh", {
    sentry_index = count.index + 1
    domain      = var.domain
    environment = var.environment
  }))

  tags = {
    Name        = "personapass-sentry-${count.index + 1}"
    Environment = var.environment
    Type        = "sentry"
    Role        = "sentry"
  }
}

# Key Pair for SSH access
resource "aws_key_pair" "validator_key" {
  key_name   = "personapass-${var.environment}-key"
  public_key = file("~/.ssh/id_rsa.pub") # Assumes SSH key exists

  tags = {
    Name        = "personapass-${var.environment}-key"
    Environment = var.environment
  }
}

# Application Load Balancer for RPC
resource "aws_lb" "rpc_lb" {
  name               = "personapass-rpc-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = false

  tags = {
    Name        = "personapass-rpc-lb"
    Environment = var.environment
  }
}

resource "aws_security_group" "lb_sg" {
  name        = "personapass-lb-sg"
  description = "Security group for PersonaPass load balancer"
  vpc_id      = aws_vpc.personapass_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
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
    Name        = "personapass-lb-sg"
    Environment = var.environment
  }
}

# Target Group for RPC
resource "aws_lb_target_group" "rpc_tg" {
  name     = "personapass-rpc-tg"
  port     = 26657
  protocol = "HTTP"
  vpc_id   = aws_vpc.personapass_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "personapass-rpc-tg"
    Environment = var.environment
  }
}

# Target Group Attachment for Validators
resource "aws_lb_target_group_attachment" "rpc_tg_attachment" {
  count = var.validator_count

  target_group_arn = aws_lb_target_group.rpc_tg.arn
  target_id        = aws_instance.validators[count.index].id
  port             = 26657
}

# Load Balancer Listener
resource "aws_lb_listener" "rpc_listener" {
  load_balancer_arn = aws_lb.rpc_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.rpc_tg.arn
  }
}

# S3 Bucket for PersonaWallet static hosting
resource "aws_s3_bucket" "wallet_bucket" {
  bucket = "wallet-${replace(var.domain, ".", "-")}"

  tags = {
    Name        = "wallet-${var.domain}"
    Environment = var.environment
    Purpose     = "PersonaWallet hosting"
  }
}

resource "aws_s3_bucket_website_configuration" "wallet_website" {
  bucket = aws_s3_bucket.wallet_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "wallet_pab" {
  bucket = aws_s3_bucket.wallet_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "wallet_policy" {
  bucket = aws_s3_bucket.wallet_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.wallet_bucket.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.wallet_pab]
}

# NOTE: CloudFront removed - using existing Cloudflare setup instead
# PersonaWallet will be hosted on S3 and served through Cloudflare
# Cloudflare DNS should point wallet.personapass.xyz to the S3 bucket endpoint

# SSL Certificate
resource "aws_acm_certificate" "ssl_cert" {
  domain_name               = "*.${var.domain}"
  subject_alternative_names = [var.domain]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "personapass-ssl"
    Environment = var.environment
  }
}

# DNS Records - commented out until Route53 zone is set up
# resource "aws_route53_record" "wallet" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "wallet.${var.domain}"
#   type    = "A"
#
#   alias {
#     name                   = aws_cloudfront_distribution.wallet_cdn.domain_name
#     zone_id                = aws_cloudfront_distribution.wallet_cdn.hosted_zone_id
#     evaluate_target_health = false
#   }
# }
#
# resource "aws_route53_record" "rpc" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "rpc.${var.domain}"
#   type    = "A"
#
#   alias {
#     name                   = aws_lb.rpc_lb.dns_name
#     zone_id                = aws_lb.rpc_lb.zone_id
#     evaluate_target_health = true
#   }
# }

# Outputs
output "validator_ips" {
  description = "IP addresses of validator nodes"
  value       = aws_instance.validators[*].public_ip
}

output "sentry_ips" {
  description = "IP addresses of sentry nodes"
  value       = aws_instance.sentry_nodes[*].public_ip
}

output "rpc_endpoint" {
  description = "RPC load balancer endpoint"
  value       = "http://rpc.${var.domain}"
}

output "wallet_s3_endpoint" {
  description = "S3 website endpoint for PersonaWallet (to configure in Cloudflare)"
  value       = aws_s3_bucket_website_configuration.wallet_website.website_endpoint
}

output "wallet_s3_bucket" {
  description = "S3 bucket name for PersonaWallet"
  value       = aws_s3_bucket.wallet_bucket.bucket
}

output "wallet_url" {
  description = "PersonaWallet URL (configure DNS in Cloudflare)"
  value       = "https://wallet.${var.domain}"
}

output "validator_endpoints" {
  description = "Direct validator endpoints"
  value = [
    for i in range(var.validator_count) :
    "http://${aws_instance.validators[i].public_ip}:26657"
  ]
}