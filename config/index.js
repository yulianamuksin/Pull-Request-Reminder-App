require('dotenv').config();

export const config =  {
    DATABASE: {
        CLIENT: process.env.DATABASE_CLIENT,
        PORT: process.env.DATABASE_PORT,
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_REPLICATE: process.env.DATABASE_REPLICATE, 
        DATABASE_AUTHENTICATION_DATABASE: process.env.DATABASE_AUTHENTICATION_DATABASE,
        MONGO_URL: process.env.MONGO_URL,
      },
      APP: {
        NODE_ENV: process.env.NODE_ENV,
        URL: process.env.APP_ADDRESS || 'http://localhost:5000',
        PORT: +process.env.APP_PORT || 5000, 
      },
      SLACK: {
        WEBHOOK_DEVOPS: process.env.SLACK_WEBHOOK_DEVOPS,
        WEBHOOK_NPS: process.env.SLACK_WEBHOOK_NPS,
        WEBHOOK_REVENUE: process.env.SLACK_WEBHOOK_REVENUE,
        BOT_USER_TOKEN: process.env.BOT_USER_TOKEN,
      },
      BITBUCKET: {
          EMAIL: process.env.BITBUCKET_EMAIL,
          PASSWORD: process.env.BITBUCKET_PASSWORD,
          BASE_URL: process.env.BASE_URL,
      },
      PAGINATION: {
        DEFAULT: 50,
        MIN: 10, 
        MAX: 100,
      }
}
