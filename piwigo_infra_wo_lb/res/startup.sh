sudo amazon-linux-extras enable nginx1 php8.0
sudo yum clean metadata
sudo yum -y install nginx
sudo yum -y install php php-{cli,fpm,pear,cgi,common,curl,mbstring,gd,mysqlnd,gettext,bcmath,json,xml,intl,zip,imap}
sudo systemctl enable --now nginx
nginx -v
sudo systemctl enable php-fpm
sudo sed -i 's/user = apache/user = nginx/g' /etc/php-fpm.d/www.conf
sudo sed -i 's/group = apache/group = nginx/g' /etc/php-fpm.d/www.conf
sudo sed -i 's/pm = dynamic/pm = ondemand/g' /etc/php-fpm.d/www.conf
sudo sed -i 's/max_execution_time = 30/max_execution_time = 300/g' /etc/php.ini
sudo sed -i 's/max_input_time = 60/max_input_time = 300/g' /etc/php.ini
sudo sed -i 's/memory_limit = 128M/memory_limit = 256M/g' /etc/php.ini
sudo sed -i 's/post_max_size = 8M/post_max_size = 32M/g' /etc/php.ini
sudo sed -i 's/post_max_size = 8M/post_max_size = 32M/g' /etc/php.ini
sudo wget https://raw.githubusercontent.com/Ahrimaan/CDK-Examples/main/piwigo_infra_wo_lb/res/nginx.conf_ -P /etc/nginx/
sudo mv /etc/nginx/nginx.conf_ /etc/nginx/nginx.conf
sudo wget https://piwigo.org/download/dlcounter.php?code=netinstall -P /usr/share/nginx/html/
sudo mv /usr/share/nginx/html/dlcounter.php\?code\=netinstall /usr/share/nginx/html/netinstall.php
sudo chmod 777 /usr/share/nginx/html/
sudo systemctl restart php-fpm
sudo systemctl restart nginx