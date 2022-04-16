const { Client, Message, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

/**
 * 
 * @param {Client} client 
 */
module.exports = (client) => {
    client.on("messageCreate", async (message) => {
        client.prefixSettings.ensure(message.guild.id, {
            prefix: 's.',
        });
        if (message.author.bot || !message.guild || message.guild.available == false) return;
        const prefix = client.prefixSettings.get(message.guild.id, "prefix");

        if (!message.content.startsWith(prefix)) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();

        if (!command || command.length == 0) return;
        client.suggestSettings.ensure(message.guild.id, {
            channel: '',
            suggestions: [],
            pending: [],
            logging: ''
        });
        if (command == 'ping') {
            const oldDate = Date.now();
            client.prefixSettings.get(message.guild.id);
            const newDate = Date.now();
            message.reply({
                embeds: [new MessageEmbed().setFooter({
                    text: "It take's time to get bot ping!"
                }).setColor("BLURPLE").setDescription(`**🤖 Bot Latency: \`${Math.round(message.createdTimestamp - Date.now())}ms\`\n💓 Api Latency: \`${client.ws.ping}ms\`\n🟢 Database Latency: \`${newDate - oldDate}ms\`**`)]
            })
        } else if (command == 'setup') {
            if (!message.member.permissions.has("MANAGE_GUILD")) return message.channel.send(`:x: **You need \`MANAGE_GUILD\` permissions to use this command!**`);

            const channelForSuggest = message.mentions.channels.at(0);
            if (!channelForSuggest) return message.reply(`:x: **You need to provide a channel for suggestion!**`);

            const channelForLogging = message.mentions.channels.at(1);
            if (!channelForLogging) return message.reply(`:x: **You need to provide a channel for logging!**\nUsage: \`${prefix}setup <suggestion channel> <logging channel>\`!`);

            client.suggestSettings.set(message.guild.id, channelForSuggest.id, "channel");
            client.suggestSettings.set(message.guild.id, channelForLogging.id, "logging");

            message.reply("✅ **Succesfully setupped suggestion system!**")

        } else if (command == 'suggest') {
            if (CheckSuggestion(message) == false) return message.reply({
                content: `:x: *Seems like suggestion is not setupped, ${message.member.permissions.has("MANAGE_GUILD") ? `You can write \`${prefix}setup <channel>\` to setup` : 'Contact a moderator to setup'}!*`
            });

            const data = client.suggestSettings.get(message.guild.id, "channel");
            const channel = message.guild.channels.cache.get(data);
            if (!channel || !channel.isText()) return message.reply({
                content: `:x: *Seems like suggestion is deleted, ${message.member.permissions.has("MANAGE_GUILD") ? `You can write \`${prefix}setup <channel>\` to resetup` : 'Contact a moderator to resetup'}!*`
            });
            const whatToSuggest = args.join(' ');
            if (!whatToSuggest) return message.reply({
                content: `:x: *Please provide a suggestion!*`
            });

            const dataOfPending = client.suggestSettings.get(message.guild.id, "pending");
            const loggingChannel = client.suggestSettings.get(message.guild.id, "logging");
            const log = message.guild.channels.cache.get(loggingChannel);
            if (!log || !log.isText()) return;
            const logEmbed = new MessageEmbed()
                .setTitle('Suggestion from user')
                .setDescription(`>>> ${whatToSuggest}`)
                .setAuthor({
                    name: message.author.tag,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setColor("BLURPLE");
            const button = new MessageActionRow()
                .addComponents([
                    new MessageButton()
                        .setStyle('SECONDARY').setEmoji('👍').setCustomId('accept'),
                    new MessageButton()
                        .setStyle('SECONDARY').setEmoji('👎').setCustomId('decline'),
                ])
            log.send({
                embeds: [logEmbed],
                components: [button]
            }).then((msg) => {
                dataOfPending.push({
                    id: message.author.id,
                    suggestion: whatToSuggest,
                    messageId: msg.id,
                });
                client.suggestSettings.set(message.guild.id, dataOfPending, "pending");
                message.reply({
                    content: `👍 **Your suggestion has been sent to admins!**\n*You will get a dm wheter it get's accepted or not!*`
                });
            });
        } else if (command == 'help') {
            const embed = new MessageEmbed()
                .setTitle(`I am ${client.user.username}`)
                .setDescription(`${client.user.username} is an suggestion discord bot used in servers which require(s) people suggestion's\nIf you want [Discord Bots Then Join Support Server](https://discord.gg/qhJ7UnxSfy, 'Support Server')`)
                .addField('All commands', '\`ping\`, \`invite\`, \`prefix\`, \`support\`, \`setup\`, \`suggest\`, ')
                .setColor("BLURPLE");

            message.reply({
                embeds: [embed]
            });
        } else if (command == 'invite') {
            message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor("GREEN")
                    .setTitle(`Invite ${client.user.username}`)
                    .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`)],
                components: [
                    new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setStyle('LINK').setEmoji('🔰').setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`).setLabel('Invite me'),
                        ])
                ]
            })
        } else if (command == 'support') {
            message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor("GREEN")
                    .setTitle(`Support Server`)
                    .setURL(`https://discord.gg/qhJ7UnxSfy`)],
                components: [
                    new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setStyle('LINK').setEmoji('🔰').setURL(`https://discord.gg/qhJ7UnxSfy`).setLabel('Support Server'),
                        ])
                ]
            })
        } else if (command == 'prefix') {
            const prefixToChange = args[0];
            if (!message.member.permissions.has("ADMINISTRATOR")) return;
            if (!prefixToChange) return;
            client.prefixSettings.set(message.guild.id, prefixToChange, "prefix");
            message.channel.send("✅ **Changed prefix to " + prefixToChange + "**");
        }
    });

    /**
         * 
         * @param {Message} message 
         * @returns {boolean}
         */
    function CheckSuggestion(message) {
        const { guild } = message;
        const data = client.suggestSettings.get(guild.id);
        if (!data) return false;
        const chanForSuggest = guild.channels.cache.get(data.channel);
        if (!chanForSuggest) return false;

        const chanForLogging = guild.channels.cache.get(data.logging);
        if (!chanForLogging) return false;

        return true
    }
    // button stuff...
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;
        if (interaction.user.bot || !interaction.guild) return;
        const data = client.suggestSettings.get(interaction.guild.id, "pending"); /* we only need array of pending suggestion*/
        await interaction.deferUpdate().catch(() => { });
        if (interaction.customId == 'accept') {
            const pendingData = data.find(i => i.messageId == interaction.message.id);
            if (!pendingData) return;

            const pendingUser = await interaction.guild.members.fetch(pendingData.id);
            if (!pendingUser) return;

            interaction.message.edit(
                {
                    components: [new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setStyle('SECONDARY').setEmoji('👍').setCustomId('accept').setDisabled(true),
                            new MessageButton()
                                .setStyle('SECONDARY').setEmoji('👎').setCustomId('decline').setDisabled(true),
                        ])]
                }
            );
            const dataForGuild = client.suggestSettings.get(interaction.guild.id);
            const channelForSuggest = interaction.guild.channels.cache.get(dataForGuild.channel);
            const suggestEmbed = new MessageEmbed()
                .setTitle('Suggestion from user')
                .setDescription(`>>> ${pendingData.suggestion}`)
                .setAuthor({
                    name: interaction.user.tag,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setColor("BLURPLE");
            channelForSuggest.send({
                embeds: [suggestEmbed],
                content: `By <@${pendingUser.id}>`,
            }).then(msg => {
                msg.react('👍');
                msg.react('👎');
            });
            try {
                pendingUser.user.send(`Your suggestion ${pendingData.suggestion} has been accepted!`)
            } catch (error) {
                try {
                    pendingUser.user.send(`Your suggestion ${pendingData.suggestion} has been accepted!`);
                } catch (error) {
                    console.log(error)
                }
            }
        } else if (interaction.customId == 'decline') {
            const pendingData = data.find(i => i.messageId == interaction.message.id);
            if (!pendingData) return;

            const pendingUser = await interaction.guild.members.fetch(pendingData.id);
            if (!pendingUser) return;

            interaction.message.edit(
                {
                    components: [new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setStyle('SECONDARY').setEmoji('👍').setCustomId('accept').setDisabled(true),
                            new MessageButton()
                                .setStyle('SECONDARY').setEmoji('👎').setCustomId('decline').setDisabled(true),
                        ])]
                }
            );
            let reason = '.';
            const col = interaction.channel.createMessageCollector({
                max: 1,
                filter: (i) => i.id == interaction.user.id,
                time: 10000
            });
            interaction.followUp({
                content: 'You have 10(s) to provide reason',
                ephemeral: true
            });
            col.on("collect", (i) => {
            });
            col.on("end", (collected) => {
                const e = collected.at(0);
                if (!e) reason = 'None';
                else reason = e;
                try {
                    pendingUser.user.send(`Your suggestion ${pendingData.suggestion} has been declined!\nReason: ${reason}`)
                } catch (error) {
                    try {
                        pendingUser.user.send(`Your suggestion ${pendingData.suggestion} has been declined!\nReason: ${reason}`);
                    } catch (error) {
                        console.log(error)
                    }
                }
            });
        }
    })
}