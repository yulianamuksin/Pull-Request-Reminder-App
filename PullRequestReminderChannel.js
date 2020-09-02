import _ from 'lodash';
import moment from 'moment-timezone';

import logger from '../infrastructure/helpers/logger';
import { REPOSITORIES } from '../config/repositories';
import bitbucketDriver from '../infrastructure/drivers/bitbucket';
import slackDriver from '../infrastructure/drivers/slack';

class PullRequestReminderChannel {
    constructor() {
        this.bitbucketDriver = bitbucketDriver;
        this.slackDriver = slackDriver;
    }

    async sendChannel(elements, count, team) {
        try {
      
          if (!elements.length) {
            logger.error(elements, `Elements ${team} not exist`);
            
            return true;
          }
          
          const message = {
              text: 'Reminder: Kindly Review These Pull Requests',
              blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: ':loud_sound: Open Pull Request(s) :loud_sound:',
                    }
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `:calendar: *${moment().tz('Asia/Jakarta').format('lll')}*   |   :fabelio: *Team: ${team.toUpperCase()}*`,
                        }
                    ]
                },
                {
                    type: 'divider'
                },
                {
                  type: 'section',
                  fields: [
                    {
                      type: 'mrkdwn',
                      text: `:man-raising-hand: @here Kindly review these *${count}* Open PR(s)`,
                    },
                  ],
                },
                {
                  type: 'context',
                  elements: elements,
                },
              ],
          }
          
          const channel = REPOSITORIES.find(c => c.team === team);
          await this.slackDriver.sendChannelMessage(channel.webhook, message);
          
        } catch (error) {
            logger.error(error, 'PRReminder-sendChannel-error');

            return false;
        }
    }

    async formatMessage(data) {

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
                text: `>:hourglass: *Title: <${data.link}|${data.title}>*\n>:recycle: *Source: ${data.source_branch}  :arrow_right:  Destination: ${data.destination_branch.toUpperCase()}*\n>:male-technologist: *Author:* ${data.author}\n>:file_folder: *Repository:* <${data.repository_link}|${data.repository_name}>\n>:mantelpiece_clock: *Created On:* ${createdOn} (*${duration}*)\n>:busts_in_silhouette: *Reviewers:* ${revs}`,
            })
            
            return elements;
        }

        return;
    }

    async collectPullRequestsDetail(prsChannel, team) {
        const formattedMessages = [];

        const prDetail = prsChannel.map(async (pd)=> {
            const prd = await this.bitbucketDriver.getPullRequestDetail(pd.repository_full_name, pd.id);
              if (prd) {
                  const formattedMessage = await this.formatMessage(prd);
                  if (formattedMessage) {
                      formattedMessages.push(...formattedMessage);
                  }
              }
        });

        await Promise.allSettled(prDetail).then(val => val.forEach(p => p.status === 'rejected' ? log.error(p.reason) : ''));

        await this.sendChannel(formattedMessages, formattedMessages.length, team);
    }
      
    async collectPullRequests() {
        const prsDevops = [];
        const prsFabelio3 = [];
        const prsNps = [];
        const prsRevenue = [];
        const prsChannels = [];

        const pullRequest = REPOSITORIES.map(async (repo)=> {
          const pr = await this.bitbucketDriver.getPullRequestList(repo.repository_name);
          switch(!_.isEmpty(pr)) {
              case repo.team === 'devops':
                  prsDevops.push(...pr);
                  break;
              case repo.team === 'fabelio3':
                  prsFabelio3.push(...pr);
                  break;
              case repo.team === 'nps':
                  prsNps.push(...pr);
                  break;
              case repo.team === 'revenue':
                  prsRevenue.push(...pr);
                  break;
          }
        });
        
        await Promise.allSettled(pullRequest).then(val => val.forEach(p => p.status === 'rejected' ? log.error(p.reason) : ''));

        prsChannels.push({prsChannel: prsDevops, team: 'devops'});
        prsChannels.push({prsChannel: prsFabelio3, team: 'fabelio3'});
        prsChannels.push({prsChannel: prsNps, team: 'nps'});
        prsChannels.push({prsChannel: prsRevenue, team: 'revenue'});

        const prsChannelDetail = prsChannels.map(async (prc)=> {
            await this.collectPullRequestsDetail(prc.prsChannel, prc.team);
        });

        await Promise.allSettled(prsChannelDetail).then(val => val.forEach(p => p.status === 'rejected' ? log.error(p.reason) : ''));
    }
    
    async execute() { 
        this.collectPullRequests();
    }
}

export default PullRequestReminderChannel;
