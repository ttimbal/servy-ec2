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
import { Credentials } from "../db-manage/models/Credentials";

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

  async getURL(projectId:string){
    const child = spawn('cd src/deploy/deploy-tf/example && terraform output -json',{shell:true});

    child.stdout.on('data', async (data) => {
      const output = JSON.parse(data);
      const { hello_output } = output

      await this.updateStateProject(projectId, {
        state: "Deployed",
        app_url:hello_output.value
      });

      console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    child.on('error', (error) => console.log(`error: ${error.message}`));

    child.on('exit', (code, signal) => {
      if (code) console.log(`Process exit with code: ${code}`);
      if (signal) console.log(`Process killed with signal: ${signal}`);
      console.log(`Done, deployed ✅`);
      fs.rm('src/repo', { recursive: true }, () => console.log('done'));
    });
  }

  async deploy(imageName: string, appName:string,projectId:string){
    await this.updateStateProject(projectId, {
      state:"Deploying with terraform..."
    });
    const changeState=`terraform init -reconfigure -backend-config="key=${imageName}"`;
    const apply=` terraform apply --auto-approve -var="ecs_image=${imageName}" -var="name=${appName}"`
    const child = spawn(`cd src/deploy/deploy-tf/example && ${changeState} && ${apply}`,{ shell: true });

    child.stdout.on("data", async (data) => {
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
        await this.getURL(projectId);
      }
      fs.rm('src/repo', { recursive: true }, () => console.log('done'));
    });
  }

  async uploadImage(imageName: string,appName:string,projectId:string) {
    await this.updateStateProject(projectId, {
      state:"Uploading image to ECR..."
    });
    const child = spawn(`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 546326832472.dkr.ecr.us-east-1.amazonaws.com && docker tag ${imageName}:latest 546326832472.dkr.ecr.us-east-1.amazonaws.com/repositories:${imageName} && docker push 546326832472.dkr.ecr.us-east-1.amazonaws.com/repositories:${imageName}`,{ shell: true });

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
        await this.deploy(imageName, appName, projectId);
      }
    });
  }

  async buildImage(project: any, folder: string,username:string) {
    await this.updateStateProject(project.id, {
      state:"Building docker image..."
    });
    const imageName=`${project.owner_id}-${project.repository}-${project.branch}`.toLowerCase();
    const appName=`${username}-${project.repository}`
    //const dockerFile=join(folder,'Dockerfile')
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
        await this.uploadImage(imageName,appName,project.id);
      }
    });
  }

  async cloneRepository(project: any,username:string) {
    await this.updateStateProject(project.id, {
      state:"Cloning repository..."
    });
    let tmpDir='src/repo';
    const appPrefix = project.repository;
    try {
     // const folderPath = join(os.tmpdir() + "/" + appPrefix);
      //fs.mkdirSync('./src/repo');
      //const child = spawn(`git clone ${project.repository_url} ${'src/repo'}`, { shell: true });
      const child = spawn(`cd src/repo && git clone ${project.repository_url} .`, { shell: true });


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
          await this.buildImage(project, tmpDir,username);
        }
      });

    } catch (e) {
      console.error(e);
    } finally {
      try {
       // if (tmpDir) {
          //fs.rmSync('src/repo', { recursive: true });
        //}
      } catch (e) {
        console.error(`An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e}`);
      }
    }
  }

  async updateStateProject(id: string, state: any) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const dbRef = doc(db, "projects", id);

    await updateDoc(dbRef, {
      ...state
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

  createRepoFolder(){
    const path = "src/repo";

    fs.access(path, (error) => {

      // To check if given directory
      // already exists or not
      if (error) {
        // If current directory does not exist then create it
        fs.mkdir(path, { recursive: true }, (error) => {
          if (error) {
            console.log(error);
          } else {
            console.log("New Directory created successfully !!");
          }
        });
      } else {
        console.log("Given Directory already exists !!");
      }
    });
  }

  @SqsMessageHandler(config.DEPLOY_QUEUE_NAME, false)
  async handleMessage(message: AWS.SQS.Message) {
    try {
      const deployRequest: DeployRequest = JSON.parse(message.Body) as DeployRequest;
      const project = await this.getProject(deployRequest.repositoryUrl);
      //const user = await this.getUser(deployRequest.username);
      await this.updateStateProject(project.id, {
        state:"Deploying..."
      });

      this.createRepoFolder();

      await this.cloneRepository(project,deployRequest.username);
      //await this.getURL("PRID2e24d21c7b8a4145841910c2fd59e5e1")

      console.log(message);
    } catch (e) {
      console.log(e);
    }finally {
      //fs.rm('src/repo', { recursive: true }, () => console.log('done'));
    }
  }
}