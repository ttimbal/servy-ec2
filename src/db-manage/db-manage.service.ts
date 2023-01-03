import {Injectable} from '@nestjs/common'
import {SqsMessageHandler} from '@ssut/nestjs-sqs'
import * as AWS from 'aws-sdk'
import {config} from '../config'
import { spawn } from "child_process";
import * as fs from "fs";

import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore,doc, updateDoc } from "firebase/firestore";
import { Credentials } from "./models/Credentials";

const firebaseConfig = {
    apiKey: "AIzaSyBUfFIFHzEuLb_BOVDmmYR867imxO_ZVKs",
    authDomain: "servy-39f0d.firebaseapp.com",
    projectId: "servy-39f0d",
    storageBucket: "servy-39f0d.appspot.com",
    messagingSenderId: "130010015298",
    appId: "1:130010015298:web:5c813ba60d29a8907c2fdb"
};

@Injectable()
export class DbManageService {
    constructor() {

    }

    removeFiles(path:string){
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

        const path1 = 'src/db-manage/database-tf/terraform.tfstate'
        const path2 = 'src/db-manage/database-tf/terraform.tfstate.backup'
        const path3 = 'src/db-manage/database-tf/.terraform.tfstate.lock.info'

        this.removeFiles(path1);
        this.removeFiles(path2);
        this.removeFiles(path3);
        //'cd src/database && terraform apply --auto-approve -var="engine=mysql"'
        //const child = spawn('cd src/db-manage/database-tf && terraform output -json',{shell:true});
        //const child = spawn('cd src/db-manage/database-tf && terraform validate',{shell:true});
        //engine=mysql
        //engine=postgres
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
    }

    async updateDatabase(id:string,credentials:any){
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        const dbRef = doc(db, "databases", id);

        await updateDoc(dbRef, {
            credentials
        });
    }

    @SqsMessageHandler(config.QUEUE_NAME, false)
    async handleMessage(message: AWS.SQS.Message) {
        try{
            const body=JSON.parse(message.Body);
            const {db_id,db_type}=body;

            await this.createDatabase(db_id,db_type);
            console.log(message);
        } catch (e) {
            console.log(e);
        }
    }
}