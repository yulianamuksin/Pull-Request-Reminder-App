import axios from 'axios';

import _ from 'lodash';


import { config } from '../../config';

import logger from '../helpers/logger';

import slack from './slack';


class bitbucketDriver {

    constructor() {

        this.bitbucketEmail = config.BITBUCKET.EMAIL;

        this.bitbucketPassword = config.BITBUCKET.PASSWORD; 

        this.baseUrl = config.BITBUCKET.BASE_URL;

        this.notification = slack;

    }
 
    async getPullRequestList(repo) {

        try {

            const {data} = await axios.get(

                `${this.baseUrl}/repositories/fabeliocoders/${repo}/pullrequests?state=OPEN`,

                {

                    auth: { 

                        username: this.bitbucketEmail, 

                        password: this.bitbucketPassword 

                    }

                }

            );

            const result = data.values.map(item => ({

                title: item.title,

                description: item.description,

                author: item.author.nickname,

                created_at: item.created_on, 

                updated_at: item.updated_on,

                link: item.links.self.href,

                repository_full_name: item.destination.repository.full_name,

                id: item.id,

            }));   

            return result;

        } catch (error) {

            logger.error(error, 'Bitbucket-getPullRequestList-error');

            return false;
        }

    } 

    async getPullRequestDetail(repoFullName, pullRequestId) {

        try {

            const {data} = await axios.get(

                `${this.baseUrl}/repositories/${repoFullName}/pullrequests/${pullRequestId}`,

                {

                    auth: { 

                        username: this.bitbucketEmail, 

                        password: this.bitbucketPassword 

                    }

                }

            );

            

            const reviewers = data.participants

                .filter(participant => participant.role === 'REVIEWER')

                .map(reviewer => ({

                    account_id: reviewer.user.account_id, 

                    nickname: reviewer.user.nickname,

                    display_name: reviewer.user.display_name,

                    slack_account_id: this.notification.getSlackAccountId(reviewer.user.nickname),

                    approved: reviewer.approved,

                }));


            

            const titleLink = _.has(data, 'links.html.href')

                ? data.links.html.href : '';


            const repoLink = _.has(data, 'destination.repository.links.html.href')

                ? data.destination.repository.links.html.href : '';


            const result = {

                title: data.title,

                link: titleLink,

                author: data.author.nickname,

                reviewers: reviewers,

                repository_name: data.destination.repository.name,

                repository_link: repoLink,

                created_at: data.created_on,

                updated_at: data.updated_on,

                source_branch: data.source.branch.name,

                destination_branch: data.destination.branch.name,

            };

            return result;

          } catch (error) {

            logger.error(error, 'Bitbucket-getPullRequestDetail-error');

            return false;

          }
    }      
}

export default new bitbucketDriver();
