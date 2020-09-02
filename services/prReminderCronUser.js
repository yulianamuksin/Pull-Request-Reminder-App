import cron from 'node-cron';

import logger from '../../infrastructure/helpers/logger';
import PullRequestReminderUser from '../../use_cases/PullRequestReminderUser';

const pullRequestReminderUser = new PullRequestReminderUser();

cron.schedule('0 9-17 * * 1-5', () => {
    logger.info('Starting PR Reminder User cron scheduler');
    pullRequestReminderUser.execute();
},
{
    scheduled: true,
    timezone: 'Asia/Jakarta',
});
