env_prefix = "staging"

/*
rds_identifier        = "mysql"
rds_engine            = "mysql"
rds_engine_version    = "8.0.15"
rds_instance_class    = "db.t2.micro"
rds_allocated_storage = 10
rds_storage_encrypted = false     # not supported for db.t2.micro instance
rds_name              = ""        # use empty string to start without a database created
rds_username          = "admin"   # rds_password is generated
*/

rds_port                    = 3306
/*
rds_maintenance_window      = "Mon:00:00-Mon:03:00"
rds_backup_window           = "10:46-11:16"
rds_backup_retention_period = 1
rds_publicly_accessible     = false

rds_final_snapshot_identifier = "prod-trademerch-website-db-snapshot" # name of the final snapshot after deletion
rds_snapshot_identifier       = null # used to recover from a snapshot

rds_performance_insights_enabled  = true*/
availability_zone = "us-east-1a"
my_ip = "181.114.102.83/32"
instance_type = "t2.micro"
script_install_docker_location="./scripts/install-docker.sh"

