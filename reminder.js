const request = require('request');
const args = process.argv.slice(2);
// user input - number of days ago to get tasks since
const daysAgo = args[0];

if (!daysAgo) return console.warn('Insert number of days');

// INTEGRATION Asana projects IDs (pools)
const INTprojectsIds = [
    328045665556747, // FRONT-encarnado
    328045665556740, // FRONT-miseravi
    328045665556734, // FRONT-onfire
    30994714493547, // DSN
    30994714493551, // QAs
    152887087446873 // BACK
];

// Get past date in ISO-8601 format
let pastDate = new Date();
pastDate.setDate(pastDate.getDate() - daysAgo); // now less number of days ago
pastDate = pastDate.toISOString();

const initializeReminder = projectsIdsArray => {
    // Fetch tasks since pastDate by project and call reminders
    projectsIdsArray.forEach(projectId => {
        const getOptions = {
            url: `https://app.asana.com/api/1.0/projects/${projectId}/tasks?opt_fields=name,projects,completed,custom_fields&completed_since=${encodeURIComponent(pastDate)}`,
            method: 'GET',
            headers: {
                'Authorization': ''// Reminder Bot personal access token
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
            'Authorization': ''// Reminder Bot personal access token
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
