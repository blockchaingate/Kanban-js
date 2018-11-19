# Server machine setup

## Certificates

1. Obtain login credentials (ssh).

2. Install certbot. 

```
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install certbot
```

3. Register a domain and forward it to your server's ip address.

4. Find out if there's any other server running on your server and stop temporarily.

4.1 Find out who's listening on port 80:

```
sudo netstat -ltnp | grep -w ':80'
```

4.2 Is there's a server on that port, stop it. 

If the server is ngnix, do:

```
sudo service nginx stop
```

5. Configure the certificate folder. Open 

5.1 Open the certbot ini folder. 
```
sudo nano /etc/letsencrypt/cli.ini
```

5.2 Add the line:

```

```

5. Generate your certificate.

```
sudo certbot certonly --config-dir /home/ubuntu/kanban/secrets_server_only --standalone -d fabbackenddemo.pro
```

6. The certificate will be generated in a folder, at the time of writing, that folder is:

```
/etc/letsencrypt/live/fabbackenddemo.pro/fullchain.pem
```

7. Change the file permissions. In the command below, replace "fabbackenddemo.pro" 
with whatever your server site name is.

```
sudo chmod 744 /etc/letsencrypt/live/fabbackenddemo.pro/fullchain.pem
sudo chmod 744 /etc/letsencrypt/live/fabbackenddemo.pro/privkey.pem
```

8. Add the file names in the configuration file 

```
secrets_admin/configuration.json
```

9. Redirect 443 ports to 52907:

```
sudo iptables -A INPUT -i eth0 -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -i eth0 -p tcp --dport 52907 -j ACCEPT
sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 52907
```
