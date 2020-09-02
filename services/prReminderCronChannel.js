import cron from 'node-cron';

import logger from '../../infrastructure/helpers/logger';
import PullRequestReminderChannel from '../../use_cases/PullRequestReminderChannel';

const pullRequestReminderChannel = new PullRequestReminderChannel();

cron.schedule('0 10,14,17 * * 1-5', () => {
    logger.info('Starting PR Reminder Channel cron scheduler');
    pullRequestReminderChannel.execute();
},
{
    scheduled: true,
    timezone: 'Asia/Jakarta',
});
