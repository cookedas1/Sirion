/* License is GPL 3.0.
- made by studio moremi
 - op@kkutu.store
*/
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const LANG = require('../language.json');
const fishList = require('../utils/fishlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('낚시')
        .setDescription(LANG.fish),
    async execute(interaction) {
        const gradeProbabilities = {
            1: 0.01,
            2: 0.05,
            3: 0.1,
            4: 0.2,
            5: 0.64,
        };

        const weightedFishList = fishList.flatMap(fish =>
            Array(Math.round(gradeProbabilities[fish.grade] * 100)).fill(fish)
        );

        const caughtFish = weightedFishList[Math.floor(Math.random() * weightedFishList.length)];
        const { name, grade, value } = caughtFish;
        const userId = interaction.user.id;

        db.run(
            `INSERT INTO catches (user_id, fish, grade, value) VALUES (?, ?, ?, ?)`,
            [userId, name, grade, value],
            (err) => {
                if (err) {
                    console.error('[시스템] ❌ Failed to insert catch into database:', err.message);
                    return interaction.reply({ content: LANG.catchlogerror, ephemeral: true });
                }

                db.run(
                    `UPDATE users SET coins = coins + ? WHERE user_id = ?`,
                    [value, userId],
                    (updateErr) => {
                        if (updateErr) {
                            console.error('❌ Failed to update user coins:', updateErr.message);
                            return interaction.reply({ content: LANG.coinerror, ephemeral: true });
                        }

                        const embed = new EmbedBuilder()
                            .setColor('#FFFFFF')
                            .setTitle(LANG.catchfish)
                            .setDescription(`${interaction.user.username}님이 **${name}**을 잡았어요!`)
                            .addFields(
                                { name: '등급', value: `${grade}등급`, inline: true },
                                { name: '가치', value: `${value}원`, inline: true },
                                { name: '판매 완료', value: `**${value}원**이 지갑에 추가되었어요!`, inline: false }
                            )
                            .setTimestamp();

                        interaction.reply({ embeds: [embed] });
                    }
                );
            }
        );
    },
};
