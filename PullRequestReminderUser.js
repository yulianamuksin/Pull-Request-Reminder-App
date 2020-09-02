import _ from 'lodash';
import moment from 'moment-timezone';

import logger from '../infrastructure/helpers/logger';
import { REPOSITORIES } from '../config/repositories';
import bitbucketDriver from '../infrastructure/drivers/bitbucket';
import slackDriver from '../infrastructure/drivers/slack';

class PullRequestReminderUser {
    constructor() {
        this.bitbucketDriver = bitbucketDriver;
        this.slackDriver = slackDriver;
    }

    async sendUser(elements, revs_false, prLink) {
        try {
      
          if (!elements.length) {
            logger.error(elements, 'Elements not exist');
            
            return true;
          }
          
          const messageText = 'You have Pull Request(s) to review';
          const messageBlocks = [
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `:loud_sound: *[ Reminder ] :*\nYou haven't reviewed these open PR(s) assigned to you. Please kindly review.`,
                  },
                ],
              },
              {
                type: 'context',
                elements: elements, 
              },
              {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'Review'
                        },
                        url: prLink,
                    }
                ]
              },
          ]
    
          const promises = revs_false.map(reviewer => {
            this.slackDriver.sendUserMessage(reviewer, messageText, messageBlocks);
          });
          
          await Promise.allSettled(promises).then(val => val.forEach(p => p.status === 'rejected' ? log.error(p.reason) : ''));
        
        } catch (error) {
            logger.error(error, 'PRReminder-sendUser-error');

            return false;
        }
    }

    formatMessage(data) {
        if (!data || data.length === 0) return;

        const elements = [];
        const revs_false = [];
        let revs = '';
        const createdOn = moment(data.created_at).format('llll');
        const duration = moment(data.created_at).fromNow();
        const createdAt = moment(data.created_at);
        const currentTime = moment();
        const hoursDiff = currentTime.diff(createdAt, 'hours');

        if(hoursDiff > 5){

            data.reviewers.forEach(reviewer => {      
              if (!reviewer.approved) revs_false.push(reviewer.slack_account_id);
            
              revs += reviewer.approved 
                ? `:heavy_check_mark: <@${reviewer.slack_account_id}>, `  
                : `<@${reviewer.slack_account_id}>, `;
            }); 
            
            revs = revs.slice(0, -2);
    
            elements.push({
                type: 'mrkdwn',
                text: `>:hourglass: *Title: <${data.link}|${data.title}>*\n>:male-technologist: *Author:* ${data.author}\n>:file_folder: *Repository:* <${data.repository_link}|${data.repository_name}>\n>:mantelpiece_clock: *Created On:* ${createdOn} (*${duration}*)\n>:busts_in_silhouette: *Reviewers:* ${revs}`,
            })
            
            return { elements, revs_false, link: data.link };
        }

        return { elements: [], revs_false: [], link: '' };
    }
      
    async collectPullRequests() {
        const pullRequests = [];

        const pullRequest = REPOSITORIES.map(async (repo)=> {
          const pr = await this.bitbucketDriver.getPullRequestList(repo.repository_name);
          if(!_.isEmpty(pr)) {
              pullRequests.push(...pr);
          }
        });
        
        await Promise.allSettled(pullRequest).then(val => val.forEach(p => p.status === 'rejected' ? log.error(p.reason) : ''));

        const prDetail = pullRequests.map(async (pd)=> {
          const prd = await this.bitbucketDriver.getPullRequestDetail(pd.repository_full_name, pd.id);

            if (prd) {
                const { elements, revs_false, link } = this.formatMessage(prd);
                await this.sendUser(elements, revs_false, link);
            }
        });
        
        await Promise.allSettled(prDetail).then(val => val.forEach(p => p.status === 'rejected' ? log.error(p.reason) : ''));

    }
    
    async execute() { 
        this.collectPullRequests();
    }
}

export default PullRequestReminderUser;
