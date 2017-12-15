const request = require('request');

// INTEGRATION asana projects IDs
let INTprojectsIds = {
    'FRONT-encarnado': '328045665556747',
    'FRONT-miseravi': '328045665556740',
    'FRONT-onfire': '328045665556734',
    'DSN': '30994714493547',
    'QAs': '30994714493551',
    'BACK': '152887087446873'
}

// Get 24hs ago time in ISO-8601 format
let yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday = yesterday.toISOString();

let getCompletedTasks = projectsIds => {
    for(let id in INTprojectsIds) {
        let getOptions = {
            url: 'https://app.asana.com/api/1.0/projects/' + INTprojectsIds[id] + '/tasks?opt_fields=completed,custom_fields&completed_since=' + encodeURIComponent(yesterday),
            method: 'GET',
            headers: {
                'Authorization': 'Bearer TOKEN'//insert personal access token
            }
        };
        // Fetch yesterday's tasks
        request(getOptions, function (error, response, body) {
            if (error) {
                console.log('error:', error);
            } else {
                const data = JSON.parse(body).data;
                // Get completed tasks with custom fields
                for(let task in data) {
                    if(data[task].completed && data[task].custom_fields) {
                        postTimeSpentReminder(data[task]);
                    }
                }
            }
        });
    }
};

let postTimeSpentReminder = task => {
    for (let field in task.custom_fields) {
        // Get tasks with empty time spent field
        if (task.custom_fields[field].name === 'Time spent' && task.custom_fields[field].number_value === null) {
            let postOptions = {
                url: 'https://app.asana.com/api/1.0/tasks/' + task.id + '/stories',
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer TOKEN'//insert personal access token
                },
                json: {
                    data: {
                        'text': '(BOT) Time spent em branco. Favor inserir tempo gasto na task.'
                    }
                }
            };
            //post reminder comment
            request(postOptions, function (error, response, body) {
                if (error || body['errors']) {
                    console.log('error:', body['errors']);
                } else {
                    console.log('Reminder succesfully posted');
                    console.log('timestamp :', body.data.created_at);
                    console.log('text: ', body.data.text);
                }
            });
            console.log(task.id);
        }
    }
};

getCompletedTasks(INTprojectsIds);
