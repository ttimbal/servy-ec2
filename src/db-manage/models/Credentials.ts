export interface RdsHostname {
  sensitive: boolean;
  type: string;
  value: string;
}

export interface RdsPassword {
  sensitive: boolean;
  type: string;
  value: string;
}

export interface RdsPort {
  sensitive: boolean;
  type: string;
  value: number;
}

export interface RdsUsername {
  sensitive: boolean;
  type: string;
  value: string;
}

export interface RdsIdentifier {
  sensitive: boolean;
  type: string;
  value: string;
}

export interface Credentials {
  rds_hostname: RdsHostname;
  rds_password: RdsPassword;
  rds_port: RdsPort;
  rds_username: RdsUsername;
  rds_identifier: RdsIdentifier;
}