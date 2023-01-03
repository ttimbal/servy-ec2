module "mydb" {
  source = "./db"
  engine = var.engine
}
output "rds_hostname" {
  description = "RDS instance hostname"
  value       = module.mydb.rds_hostname
  //sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.mydb.rds_port
  sensitive   = true
}

output "rds_username" {
  description = "RDS instance root username"
  value       = module.mydb.rds_username
  sensitive   = true
}

output "rds_password" {
  description = "RDS instance root username"
  value       = module.mydb.rds_password
  sensitive   = true
}

output "rds_identifier" {
  description = "RDS instance hostname"
  value       =  module.mydb.rds_identifier
  sensitive   = true
}