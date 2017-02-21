
if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

if (!process.env.MONGOURI) {
    console.log('Error: Specify mongo Uri in environment');
    process.exit(1);
}

var express= require("express");
var app = express();
var Botkit = require('botkit');
var os = require('os');
var mongoStorage = require('botkit-storage-mongo')({mongoUri: process.env.MONGOURI });

app.listen(process.env.PORT || 8080);

var controller = Botkit.slackbot({
    debug: false,
    require_delivery: true,
    storage: mongoStorage,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

controller.hears(['store (.*)', 'save (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var note = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                  convo.ask('What lable should I store this note under?', function(response, convo) {
                    convo.ask('Save lable as: ' + response.text.toLowerCase() + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) { convo.next(); }
                            },
                            {
                                pattern: 'ok',
                                callback: function(response, convo) { convo.next(); }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) { convo.stop(); }
                            },
                            {
                                pattern: 'cancel',
                                callback: function(response, convo) { convo.stop(); }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);
                        convo.next();

                    }, {'key': 'nickname'});
                    
                  convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            controller.storage.users.get(message.user, function(err, user) {
                              if(err){ console.log("Error getting user"); }
                                if(!user.notes){ user.notes = {}; }
                                user.notes[convo.extractResponse('nickname').toLowerCase()] = note;
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Saved');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, NOTE NOT SAVED!');
                        }
                    });
                }
              
            });
            
        } else {
            bot.reply(message, "I'm sorry but I can't save your notes until you ID yourself. Use command 'call me <name>");
        }
    });
});

controller.hears(['delete (.*)', 'remove (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var id = message.match[1].toLowerCase();
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name && user.notes[id]) { 
          delete user.notes[id];
          controller.storage.users.save(user, function(err, _id) 
          {
            bot.reply(message,id+" has been deleted.");
          });
          
        }else{
          bot.reply(message,"Could not find note: "+id);
        }
    });
});

/*
controller.hears(['add-to (.*)', 'append (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var id = message.match[1].toLowerCase();
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name && user.notes[id]) {
           
        }
        else{ bot.reply(message,"Could not find note: "+id); }
    });

}); */

controller.hears(['get (.*)', 'retrive (.*)','grab (.*)'], 'direct_message,direct_mention,mention', function(bot, message) { 
  
  var id = message.match[1].toLowerCase();
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name && user.notes[id]) { 
          bot.reply(message,user.notes[id]);
        }else{
          bot.reply(message,"Could not find note: "+id);
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name+":lion_face:";
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what are your commands','commands'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        
            bot.reply(message, 'The commands I respond to are: \n "Hello" or "Hi" \n "my name is <nickname> or "call me <nickname>" \n "what is my name" or "who am I" \n "uptime" or "who are you" \n "save <Note-to-save>" or "store <Note-to-save>" \n "get <Note-Lable>" or "retrive <Note-Lable>" or "grab <Note-Lable>" \n "delete <Note-Lable>" or "remove <Note-Lable>" \n "add-to <Note-Lable>" or "append <Note-Lable>"');
        
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'ok',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });
    
controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello. For a list of my commands just ask "what are your commands"');
        }
    });
});

controller.hears(['shutdown (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
  if( message.match[1] != process.env.SHUTDOWNCODE){ return; }
    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
