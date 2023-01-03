# -----------------------------------------------------------------------------
# Common data lookups
# -----------------------------------------------------------------------------
data "aws_region" "current" {}
data "aws_vpc" "current" {
  filter {
    name   = "tag:Name"
    values = ["staging-vpc"]
  }
}

data "aws_subnets" "current" {
  filter {
    name   = "tag:Name"
    values = ["Public Subnet 1", "Public Subnet 2"]
  }
}

/*data "aws_subnets" "current" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.current.id]
  }
}*/
