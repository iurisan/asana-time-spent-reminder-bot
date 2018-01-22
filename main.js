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
yesterday.setDate(yesterday.getDate() - 1); // now less 1 day
yesterday = yesterday.toISOString();

const initializeReminder = projectsIdsArray => {
    // Fetch yesterday's tasks by project and call reminders
    projectsIdsArray.forEach(projectId => {
        const getOptions = {
            url: `https://app.asana.com/api/1.0/projects/${projectId}/tasks?opt_fields=name,projects,completed,custom_fields&completed_since=${encodeURIComponent(yesterday)}`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer 0/34784122c7fc335cb34435c5682bddee'// Reminder Bot personal access token
            }
        };
        request(getOptions, function (error, response, body) {
            if (error) {
                console.error(`Error fetching tasks for project id ${projectId}:`, error);
            } else {
                const returnedTasks = JSON.parse(body).data;
                callReminders(returnedTasks);
            }
        });
    });
};

const callReminders = tasksArray => {
    tasksArray.forEach(task => {
        // Call time spent reminder
        if(task.completed && task.custom_fields) {
            // Check if task is missing time spent
            const isMissingTimeSpent = task.custom_fields.some(field => {
                return field.name === 'Time spent' && field.number_value === null;
            });
            // Check if task is for TAM
            const isTamTask = task.name.indexOf('[TAM]') > -1;
            // Check if task is from other team
            const isFromOtherTeam = task.projects.some(project => {
                return INTprojectsIds.indexOf(project.id) === -1;
            });

            if (isMissingTimeSpent && !isTamTask && !isFromOtherTeam) {
                sendTimeSpentReminder(task);
            }
        }
        //TODO
        // Call missing TAGS reminder
        // if (task.completed && task.tags && task.tags.length === 0) {};
    });
};

const sendTimeSpentReminder = task => {
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
    request(postOptions, function (error, response, body) {
        if (body['errors']) {
            console.error(`Error posting time spent reminder for task id ${task.id}:`, body['errors']);
        } else {
            console.log('Time spent reminder succesfully posted');
            console.log('task name:', task.name);
            console.log('task id: ', task.id);
        }
    });
};

// Remind tasks for Integration projects
initializeReminder(INTprojectsIds);
