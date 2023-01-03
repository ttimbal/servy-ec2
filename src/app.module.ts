import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbManageModule } from "./db-manage/db-manage.module";
import { DeployModule } from "./deploy/deploy.module";

@Module({
  imports: [
    DbManageModule,
    DeployModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
