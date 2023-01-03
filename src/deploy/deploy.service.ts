import { Injectable } from "@nestjs/common";
import { SqsMessageHandler } from "@ssut/nestjs-sqs";
import * as AWS from "aws-sdk";
import { config } from "../config";
import { spawn } from "child_process";
import * as fs from "fs";

import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, doc, updateDoc, where, query } from "firebase/firestore";
import { DeployRequest } from "./models/DeployRequest";
import * as os from "os";
import { join } from "path";

const firebaseConfig = {
  apiKey: "AIzaSyBUfFIFHzEuLb_BOVDmmYR867imxO_ZVKs",
  authDomain: "servy-39f0d.firebaseapp.com",
  projectId: "servy-39f0d",
  storageBucket: "servy-39f0d.appspot.com",
  messagingSenderId: "130010015298",
  appId: "1:130010015298:web:5c813ba60d29a8907c2fdb"
};

@Injectable()
export class DeployService {
  constructor() {

  }

  /*    removeFiles(path:string){
          try {
              fs.unlinkSync(path)
              console.log('removed');
          } catch(err) {
              console.error(err)
          }

      }


      async getCredentials(db_id:string){
          const child = spawn('cd src/db-manage/database-tf && terraform output -json',{shell:true});

          child.stdout.on('data', (data) => {
              const credentials:Credentials=JSON.parse(data);
              const credentialValues={
                  host:credentials.rds_hostname.value,
                  username:credentials.rds_username.value,
                  password:credentials.rds_password.value,
                  port:credentials.rds_port.value
              }

              this.updateDatabase(db_id,credentialValues)
              console.log(`stdout: ${data}`);
          });

          child.stderr.on('data', (data) => {
              console.log(`stderr: ${data}`);
          });

          child.on('error', (error) => console.log(`error: ${error.message}`));

          child.on('exit', (code, signal) => {
              if (code) console.log(`Process exit with code: ${code}`);
              if (signal) console.log(`Process killed with signal: ${signal}`);
              const path1 = 'src/db-manage/database-tf/terraform.tfstate'
              const path2 = 'src/db-manage/database-tf/terraform.tfstate.backup'
              const path3 = 'src/db-manage/database-tf/.terraform.tfstate.lock.info'

              this.removeFiles(path1);
              this.removeFiles(path2);
              this.removeFiles(path3);
              console.log(`Done ✅`);
          });
      }

      async createDatabase(db_id,db_type:string) {



          const child = spawn('cd src/db-manage/database-tf && terraform validate && terraform apply --auto-approve -var="engine='+db_type,{shell:true});

          child.stdout.on('data', (data) => {
              console.log(`stdout: ${data}`);
          });

          child.stderr.on('data', (data) => {
              console.log(`stderr: ${data}`);
          });

          child.on('error', (error) => console.log(`error: ${error.message}`));

          child.on('exit', (code, signal) => {
              if (code) console.log(`Process exit with code: ${code}`);
              if (signal) console.log(`Process killed with signal: ${signal}`);
              console.log(`Done ✅`);
              this.getCredentials(db_id)
          });
      }*/

  async uploadImage(imageName: string) {
    const child = spawn(`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 546326832472.dkr.ecr.us-east-1.amazonaws.com && docker tag ${imageName}:latest 546326832472.dkr.ecr.us-east-1.amazonaws.com/repositories:${imageName} && docker push 546326832472.dkr.ecr.us-east-1.amazonaws.com/repositories:${imageName}`,{ shell: true });

    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
    });

    child.on("error", (error) => console.log(`error: ${error.message}`));

    child.on("exit", (code, signal) => {
      if (code) console.log(`Process exit with code: ${code}`);
      if (signal) console.log(`Process killed with signal: ${signal}`);
      console.log(`Done ✅`);
    });
  }

  async buildImage(project: any, folder: string) {
    const imageName=`${project.owner_id}-${project.repository}-${project.branch}`.toLowerCase();
    const dockerFile=join(folder,'Dockerfile')
    //const child = spawn(`docker build -t ${imageName} . -f ${dockerFile}`,{ shell: true });
    const child = spawn(`cd src/repo && docker build -t ${imageName} .`,{ shell: true });

    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
    });

    child.on("error", (error) => console.log(`error: ${error.message}`));

    child.on("exit", async (code, signal) => {
      if (code) console.log(`Process exit with code: ${code}`);
      if (signal) console.log(`Process killed with signal: ${signal}`);
      console.log(`Done ✅`);
      if (!code && !signal) {
        await this.uploadImage(imageName);
      }
    });
  }

  async cloneRepository(project: any) {
    let tmpDir;
    const appPrefix = project.repository;
    try {
      const folderPath = join(os.tmpdir() + "/" + appPrefix);
      tmpDir = fs.mkdtempSync(folderPath);
      console.log(tmpDir);
      //const child = spawn(`git clone ${project.repository_url} ${'src/repo'}`, { shell: true });
      const child = spawn(`cd src/repo && git clone ${project.repository_url}`, { shell: true });


      child.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
      });

      child.stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
      });

      child.on("error", (error) => console.log(`error: ${error.message}`));

      child.on("exit", async (code, signal) => {
        if (code) console.log(`Process exit with code: ${code}`);
        if (signal) console.log(`Process killed with signal: ${signal}`);
        console.log(`Done ✅`);
        if (!code && !signal) {
          await this.buildImage(project, tmpDir);
        }
      });

    } catch (e) {
      console.error(e);
    } finally {
      try {
        if (tmpDir) {
          //fs.rmSync(tmpDir, { recursive: true });
        }
      } catch (e) {
        console.error(`An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e}`);
      }
    }
  }

  async updateStateProject(id: string, state: string) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const dbRef = doc(db, "projects", id);

    await updateDoc(dbRef, {
      state
    });
  }

  async getProject(url: string) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const q = query(collection(db, "projects"), where("repository_url", "==", url));

    const querySnapshot = await getDocs(q);
    let project;
    querySnapshot.forEach((doc) => {
      project = doc.data();
    });

    return project;
  }


  async getUser(username: string) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const q = query(collection(db, "users"), where("username", "==", username));

    const querySnapshot = await getDocs(q);
    let user;
    querySnapshot.forEach((doc) => {
      user = doc.data();
    });

    return user;
  }


  @SqsMessageHandler(config.DEPLOY_QUEUE_NAME, false)
  async handleMessage(message: AWS.SQS.Message) {
    try {
      const deployRequest: DeployRequest = JSON.parse(message.Body) as DeployRequest;
      const project = await this.getProject(deployRequest.repositoryUrl);
      const user = await this.getUser(deployRequest.username);
      await this.updateStateProject(project.id, "deploying...");
      await this.cloneRepository(project);


      console.log(message);
    } catch (e) {
      console.log(e);
    }
  }
}