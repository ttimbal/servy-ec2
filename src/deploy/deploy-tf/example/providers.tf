#This installs the provider for aws & docker
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"

    }
  }
  backend "s3" {
    bucket = "servy-tf-files"
    //key    = "deploys/${var.ecs_image}/state.tfstate"
    region = "us-east-1"
  }
}


provider "aws" {
  region = "us-east-1"
}