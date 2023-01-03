import { Module } from '@nestjs/common'
import { SqsModule } from '@ssut/nestjs-sqs'

import { DeployService } from './deploy.service'
import * as AWS from 'aws-sdk'
import { config } from '../config'


AWS.config.update({
  region: config.AWS_REGION,
  accessKeyId: config.ACCESS_KEY_ID,
  secretAccessKey: config.SECRET_ACCESS_KEY,
})

@Module({
  imports: [
    SqsModule.register({
      consumers: [
        {
          name: config.DEPLOY_QUEUE_NAME, // name of the queue
          queueUrl: config.DEPLOY_QUEUE_NAME, // the url of the queue
          region: config.AWS_REGION,
        },
      ],
      producers: [],
    }),
  ],
  controllers: [],
  providers: [DeployService],
})
export class DeployModule {}
