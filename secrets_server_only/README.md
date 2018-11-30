# Server-only secrets

This folder is to contain server-only secrets. 
Except for the present readme, 
no other files should be present in the repository. 
Should you change the secrets set up, please update this file.

The present folder is added in the .gitignore to prevent you from accidentally adding it to 
your development repository. 


Secrets in this folder are expected to be read by the server only. 
Unlike the secrets in folder secrets_admin admin secrets, the contents in this folder should only be updated through an ssh connection.

The following secrets are to be located here.
1. Kanban ssl certificates.
2. Certbot folders.

