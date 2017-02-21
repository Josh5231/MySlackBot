"My Slackbot" AKA "Note-bot" ver 1.0.1
by Josh Sanders

Built with "botkit" - http://howdy.ai

Bot running on https://slackbot01.heroku.com

Current command list:

'call me <Nick-Name>', 'my name is <Nick-Name>'  - Setup user and associate the user's slack ID with the provided Nick-Name

"Hello" or "Hi" - Simple introductions

"what is my name" or "who am I" - Check if bot has setup user

"what are your commands" or "commands" - Get a list of commands that Note-bot will respond to

"uptime" or "who are you" - Get info about the bot and it's uptime

"save <Note-to-save>" or "store <Note-to-save>" - Store a "note" in DB associated with "this" user

"get <Note-Lable>" or "retrive <Note-Lable>" or "grab <Note-Lable>" - Retrieve note from DB

"delete <Note-Lable>" or "remove <Note-Lable>" - Delete note

"add-to <Note-Lable>" or "append <Note-Lable>" - Add text into a note
