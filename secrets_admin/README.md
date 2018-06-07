# Admin secrets

This folder is to contain admin secrets. 
Except for the present readme, no other files should be present in the repository. 
Should you change the secrets set up, please update this file.

The present folder is added in the .gitignore to prevent you from accidentally adding it to 
your development repository. 


Secrets in this folder are expected to be read by the server's admin through the web browser. 
The contents of this folder are less secure than the secrets in folder secrets_server_only, 
in that they can be accessed by the admin through the node webserver. 

A bad login mechanism of our node webserver will leak the secrets stored here.

The following secrets are to be located here.
1. ssl certificates of remote nodes owned by the present node.
