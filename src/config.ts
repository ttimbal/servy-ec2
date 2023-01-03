require('dotenv').config();
export const config = {
    QUEUE_NAME : process.env.QUEUE_NAME,
    DEPLOY_QUEUE_NAME : process.env.DEPLOY_QUEUE_NAME,
    AWS_REGION: process.env.AWS_REGION,
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
};
