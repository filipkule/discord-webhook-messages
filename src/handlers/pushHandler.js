const core = require('@actions/core')
const github = require('@actions/github')
const { WebhookClient, MessageEmbed } = require('discord.js')
const { extractDataFromWebhookUrl } = require('../helpers')

module.exports = ({ webhookUrl }) => {
    const { payload, eventName } = github.context

    if (eventName !== 'push') {
        console.warn('push handler can be executed only on "push" action triggers')
        return Promise.resolve()
    }

    const {commits, repository: {language}, sender: {login}} = payload
    const data = {commits, language, login}

    const { id, token } = extractDataFromWebhookUrl(webhookUrl)
    const client = new WebhookClient(id, token)
    
    return client.send(createEmbed(data)).then(result => {
        client.destroy()
        return ''
    }).catch(error => {
        client.destroy()
        throw error
    })
}


function createEmbed({ commits, language, login}) {
    let embed = new MessageEmbed({ type: 'rich' })
    let description =  createDescription(commits, language)
    embed.setColor(0x32ecab)
    embed.setTitle(login + ' pushed some changes')
    embed.setDescription(description)
    embed.setFooter(`Number of commits: ${commits.length}`)
    embed.setTimestamp(new Date(commits[commits.length-1].timestamp))
    return embed
}


function createDescription(commits, language) {
    let description = 'Writen in: ' + language + '\n'
    + 'Following commits were added: \n'
    for(let commit of commits){
        description += `\`${commit.id.substring(0, 6)}\` - ` + `**${commit.message}**` + '\n'
    }
    return description
}