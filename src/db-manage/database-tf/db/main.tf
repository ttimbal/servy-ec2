data "aws_db_subnet_group" "subnet_group" {
  name = "my-db-subnet-group"
}

data "aws_security_group" "selected" {
  name = "rds-sg"
}

resource "random_string" "username" {
  length  = 16
  lower = true
  special = false
  numeric = false
  upper = false
}

resource "random_password" "password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_instance" "mydb2" {
  identifier        = "servy-db-${random_string.username.result}"
  allocated_storage = 5
  engine            = var.engine
  instance_class         = "db.t3.micro"
  password               = random_password.password.result
  username               = random_string.username.result
  publicly_accessible    = true
  skip_final_snapshot    = true
  db_subnet_group_name   = data.aws_db_subnet_group.subnet_group.name
  vpc_security_group_ids = [data.aws_security_group.selected.id]
  //security_group_names = [aws_security_group.sg_rds.name]
}

output "rds_identifier" {
  description = "RDS instance hostname"
  value       = aws_db_instance.mydb2.identifier
  sensitive   = true
}

output "rds_hostname" {
  description = "RDS instance hostname"
  value       = aws_db_instance.mydb2.address
  //sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.mydb2.port
  sensitive   = true
}

output "rds_username" {
  description = "RDS instance root username"
  value       = aws_db_instance.mydb2.username
  sensitive   = true
}

output "rds_password" {
  description = "RDS instance root username"
  value       = aws_db_instance.mydb2.password
  sensitive   = true
}

output "pass" {
  sensitive = true
  value     = random_password.password.result
}


output "username" {
  sensitive = true
  value     = random_string.username.result
}