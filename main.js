const request = require('request');

// INTEGRATION asana projects IDs
const INTprojectsIds = [
    328045665556747, // FRONT-encarnado
    328045665556740, // FRONT-miseravi
    328045665556734, // FRONT-onfire
    30994714493547, // DSN
    30994714493551, // QAs
    152887087446873 // BACK
];

// Get 24hs ago date in ISO-8601 format
let yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 7); // today - 1 day
yesterday = yesterday.toISOString();

const getCompletedTasks = projectsIdsArray => {
    projectsIdsArray.forEach(projectId => {
        const getOptions = {
            url: `https://app.asana.com/api/1.0/projects/${projectId}/tasks?opt_fields=name,projects,completed,custom_fields&completed_since=${encodeURIComponent(yesterday)}`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer 0/34784122c7fc335cb34435c5682bddee'// Reminder Bot personal access token
            }
        };
        // Fetch yesterday's tasks
        request(getOptions, function (error, response, body) {
            if (error) {
                console.error('error:', error);
            } else {
                const data = JSON.parse(body).data;
                for(let task in data) {
                    if(data[task].completed && data[task].custom_fields) {
                        let isMissingTimeSpent = data[task].custom_fields.some(field => {
                            return field.name === 'Time spent' && field.number_value === null;
                        });
                        let isTamTask = data[task].name.indexOf('[TAM]') > -1;
                        let isFromOtherTeam = data[task].projects.some(project => {
                            return INTprojectsIds.indexOf(project.id) === -1;
                        });

                        if (isMissingTimeSpent && !isTamTask && !isFromOtherTeam) {
                            postTimeSpentReminder(data[task]);
                        }
                    }
                }
            }
        });
    });
};

const postTimeSpentReminder = task => {
    const postOptions = {
        url: `https://app.asana.com/api/1.0/tasks/${task.id}/stories`,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer 0/34784122c7fc335cb34435c5682bddee'// Reminder Bot personal access token
        },
        json: {
            data: {
                'text': 'Time spent em branco. Favor inserir tempo gasto na task.'
            }
        }
    };
    //post reminder comment
    request(postOptions, function (error, response, body) {
        if (error || body['errors']) {
            console.error('error:', body['errors']);
        } else {
            console.log('Reminder succesfully posted');
            console.log('task name:', task.name);
            console.log('task id: ', task.id);
        }
    });
};

getCompletedTasks(INTprojectsIds);
