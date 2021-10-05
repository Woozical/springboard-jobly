# Jobly Backend

This is the Express backend for Jobly, version 2. The original source code can be found on the aptly named `original-code` branch. All of my contributions exist on the `master` branch.

## Getting started

Install all dependencies with `npm i`  
The project uses PostgreSQL as its RDBMS.  
To run this project:
    
    node server.js

This will start the API server on `localhost:3001/`

To run the tests (make sure [jest](https://www.npmjs.com/package/jest) is installed, it is not listed as a dependency):

    jest -i

The entirey of this project is a RESTFUL JSON API, you can play around with it in a tool like [Insomnia](https://insomnia.rest/).

## Routes

### /auth

Authorization and authentication is performed using JSON Web Tokens. Send your JWT as bearer tokens in the authorization header of all of your requests sent to the API.

#### POST /auth/register

This route is used to create new users in the database. Include the following in the payload of your POST request, all fields are required:
``` json
{
    "username": "string, max 30 chars",
    "password": "string, min 5 chars, max 20 chars",
    "firstName": "string, max 30 chars",
    "lastName": "string, max 30 chars",
    "email": "string, email format, min 6 chars, max 60 chars"
}
```

This will create a new entry in the users table of the database, with a hashed and salted password. The server will respond with the auth token for the newly registered user.


#### POST /auth/token

This route is used to get another auth token. Send the username and password of the user you want to authenticate as in your request payload. If the credentials are valid, the server will respond with an auth token.
``` json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtc2ciOiJjb25ncmF0dWxhdGlvbnMiLCJob3dldmVyIjoibm90IGEgdmVyeSByZXdhcmRpbmcgc2VjcmV0LCBpcyBpdD8ifQ.PpjeIMk-mILsVOG-eLDcgmrmkXyNTnXRt01bFMfbtSU" }
```

<hr>

### /companies

Routes corresponding with the companies table in the database. Each company uses its `handle` as its primary key, and thus its identifer in the routes.

#### GET /companies
##### Auth Required: None
This endpoint will respond with a list of all companies in the database, with the following format:
``` json
{
    "companies": [
        {"handle", "name", "description", "numEmployees", "logoUrl"},
        {"handle", "name", "description", "numEmployees", "logoUrl"},
        ...
    ]
}
```

You can filter your results by passing parameters to the query string. The following parameters are available:
- minEmployees: Company's `numEmployees` must be equal to or greater than this number.
- maxEmployees: Company's `numEmployees` must be equal to or less than this number.
- name: Company must have this string appearing somewhere in its `name`, case insensitive.

E.g. `/companies?name=micro&maxEmployees=300` will return a list of all companies where `"micro"` appears somwhere in their company name, and that have no more than `300` employees.

#### GET /companies/:handle
##### Auth Required: None
This endpoint will respond with more in depth data on a given company, including a list of all current job offerings.
E.g. `/companies/valve`:
```json
{
    "company": {
        "handle": "valve",
        "name": "Valve Corporation",
        "description": "Will eventually release HL3",
        "numEmployees": 1000,
        "logoUrl": "https://www.valvesoftware.com/logo.png",
        "jobs": [
            {"id", "title", "salary", "equity", "companyHandle"},
            {"id", "title", "salary", "equity", "companyHandle"},
            ...
        ]
    }
}
```

#### POST /companies
##### Auth Required: Admin
Creates a new entry in the companies table of the database. Include the following in the payload of your request, `name`, `handle`, and `description` are required:
```json
{
    "handle": "string, max 10 chars", 
    "name": "string, max 30 chars", 
    "description": "string",
    "numEmployees": integer (min 0),
    "logoUrl": "string, URI format"
}
```

#### PATCH /companies/:handle
##### Auth Required: Admin
Update the data of an existing company in the database. Include any of the following fields in the payload of your request:
```json
{
    "name": "string, max 30 chars",
    "description": "string",
    "numEmployees": integer (min 0),
    "logoUrl": "string, URI format"
}
```
Will respond with a JSON object reflecting the update company data.

#### DELETE /companies/:handle
##### Auth Required: Admin
Delete the given entry from the companies table in the database. Will respond with a JSON object containing a message on successful deletion.

<hr>

### /jobs
#### GET /jobs
##### Auth Required: None
Will respond with a JSON object listing all of the current jobs in the database. It should be noted that `equity` is returned as a string in order to preserve precision.
```json
{
    "jobs": [
        {"id", "title", "salary", "equity", "companyHandle"},
        {"id", "title", "salary", "equity", "companyHandle"},
        ...
    ]
}
```
Like companies, the results of this route can also be filtered using the query string. The following parameters are available:
- minSalary: Job's `salary` must be equal to or greater than this number.
- hasEquity: Job's `equity` must be greater than `0` if this parameter is set to `true`.
- title: Job must have this string appearing somewhere in its `title`, case insensitive.

E.g. `/jobs?title=engineer&hasEquity=true&minSalary=90000` will return a list of all jobs where `"engineer"` appears somewhere in the job title, has an equity percentage greater than `0`, and has a salary of at least `90000`.

#### GET /jobs/:id
##### Auth Required: None
Will respond with more detailed information on the given job listing.
```json
{
    "job": {
        "id": 20,
        "title": "Courier",
        "salary": 55000,
        "equity": "0.02",
        "company": { "handle", "name", "description", "numEmployees", "logoUrl" }
    }
}
```

#### GET /jobs/:id/applicants
##### Auth Required: Admin
Will respond with detailed information on the given job listing, including a list of all users that have applied for this job.
```json
{
    "job": {
        "id": 20,
        "title": "Courier",
        "salary": 55000,
        "equity": "0.02",
        "companyHandle": "house-ind",
        "applicants": [
            {"username", "firstName", "lastName", "email", "isAdmin"},
            {"username", "firstName", "lastName", "email", "isAdmin"},
            ...
        ]
    }
}
```

#### POST /jobs
##### Auth required: Admin
Will create a new entry in the jobs table of the database. Send the following in the payload of your request, `title` and `companyHandle` are required:
```json
{
    "title": "string",
    "salary": integer (min 0),
    "equity": number (min 0, max 1.0),
    "companyHandle": "string, must be valid existing company handle"
}
```
A successful request will be responded to with data reflecting the newly created job, including its unique id in the database.

#### PATCH /jobs/:id
##### Auth required: Admin
Will update an existing job entry in the database with new data. Send any of the following in the payload of your request:
```json
{
    "title": "string",
    "salary": integer (min 0),
    "equity": number (min 0, max 1.0)
}
```
A successful request will be responded with data reflecting the up-to-date job information.

#### DELETE /jobs/:id
##### Auth required: Admin
Will delete the given entry from the jobs table in the database. Will respond with a JSON object containing a message on successful deletion.  
```json
{ "deleted" : 20 }
```

<hr>

### /users
#### GET /users
##### Auth required: Admin
Responds with a json object containing a list of all users in the database.
```json
{
    "users": [
        {"username", "firstName", "lastName", "email", "isAdmin" },
        {"username", "firstName", "lastName", "email", "isAdmin" },
        ...
    ]
}
```

#### GET /users/:username
##### Auth required: Same User or Admin
Responds with a json object with data on the given user. This route is only available to non-admins if their auth token proclaims themselves to be the requested user.
```json
{
    "user": {
        "username": "jd1911",
        "firstName": "John" ,
        "lastName": "Doe",
        "email": "jdoe11@user.com",
        "isAdmin": false
        }
}
```
#### GET /users/:username/applications
##### Auth required: Same User or Admin
Responds with a json object with data on the given user, as well as all of the jobs that user has applied to.
```json
{
    "user": {
        "username": "jd1911",
        "firstName": "John" ,
        "lastName": "Doe",
        "email": "jdoe11@user.com",
        "isAdmin": false,
        "applications": [
            {"id", "title", "salary", "equity", "companyHandle"},
            {"id", "title", "salary", "equity", "companyHandle"},
            ...
            ]
        }
}
```
#### POST /users
##### Auth required: Admin
Creates a new user in the database. This is NOT the registration endpoint --- instead, this is only for admin users to add new users. The payload required for this route is the same schema as [/auth/register](#post-authregister), except that `isAdmin` can be included to create a new admin user. The route responds with the newly created user and an authentication token for them:
```json
    {
       "user": { "username", "firstName", "lastName", "email", "isAdmin" }, "token" 
    }
```

#### POST /users/:username/jobs/:id
##### Auth required: Same User or Admin
Creates an association between a given user and job (i.e., registers the user as an applicant for that job). A successful request with be responded to with a JSON object containing the id of the job that was applied to.
```json
{ "applied" : 20 }
```

#### PATCH /users/:username
##### Auth required: Same User or Admin
Will update an existing user entry in the database with new data. Send any of the following in the payload of your request:
```json
{
    "password": "string, min 5 chars, max 20 chars",
    "firstName": "string, max 30 chars",
    "lastName": "string, max 30 chars",
    "email" : "string, email format, min 6 chars, max 60 chars"
}
```
A successful request will be responded with data reflecting the up-to-date user information (barring password).

#### DELETE /users/:username
##### Auth required: Same User or Admin
Will delete the given user from the users table in the database. Will respond with a JSON object containing a message on successful deletion.  
```json
{ "deleted" : "jd1911" }
```