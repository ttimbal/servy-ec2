/*resource "aws_ecr_repository" "foo" {
  name                 = "repositories"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository_policy" "foopolicy" {
  repository = aws_ecr_repository.foo.name

  policy = <<EOF
{
    "Version": "2008-10-17",
    "Statement": [
        {
            "Sid": "new policy",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:BatchCheckLayerAvailability",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:DescribeRepositories",
                "ecr:GetRepositoryPolicy",
                "ecr:ListImages",
                "ecr:DeleteRepository",
                "ecr:BatchDeleteImage",
                "ecr:SetRepositoryPolicy",
                "ecr:DeleteRepositoryPolicy"
            ]
        }
    ]
}
EOF
}*/

module "my-app" {
  source = "../"

  name = var.name//"test-hello-world" //username-repo
  //owner_id-repo-branch

  ecs_image  = var.ecs_image//"546326832472.dkr.ecr.us-east-1.amazonaws.com/repositories:servy"
  ecs_cpu    = 512
  ecs_memory = 1024
  tags = {
    "application" = var.name//"hello-world-rest"
  }
}

output "hello_output" {
  value = module.my-app.alb_dns_name
}