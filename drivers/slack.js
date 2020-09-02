import axios from 'axios';
import { WebClient } from '@slack/web-api';

import { config } from '../../config'
import logger from '../helpers/logger';
import { DEVELOPERS } from '../../config/developers';

class slackDriver {
    constructor() {
        this.botUserToken = config.SLACK.BOT_USER_TOKEN;
        this.webClient = new WebClient(this.botUserToken);
    }

    getSlackAccountId(nickname) {
        const rev = DEVELOPERS.find(r => r.nickname === nickname);
        if (!rev) {
            logger.error(nickname, 'Nickname not exist');
            
            return '';
        }

        return rev.slack_account_id;
    }
    
    async sendChannelMessage(webhookURL, message) {
        try {
            const { data } = await axios.post(webhookURL, message, {
              headers: {
                'content-type': 'application/json',
              },
            });
      
            return data;
      
        } catch (error) {
            logger.error(error, 'Slack-sendChannelMessage-error');
      
            return false;
        }
    }
    
    async sendUserMessage(userId, messageText, messageBlocks) {
        try{
            if (!userId) {
                logger.error('No user id');
            
                return false;
            }

            const result = await this.webClient.chat.postMessage({
                text: messageText,
                blocks: messageBlocks,
                channel: userId,
            });
            
            return result;
        } catch (error) {
            logger.error(error, 'Slack-sendUserMessage-error');
      
            return false;
        }
    }
}

export default new slackDriver();
