sudo su
amazon-linux-extras enable nginx1 php8.0
yum clean metadata
yum -y install nginx
yum -y install php php-{cli,fpm,pear,cgi,common,curl,mbstring,gd,mysqlnd,gettext,bcmath,json,xml,intl,zip,imap}
systemctl enable --now nginx
nginx -v
systemctl enable php-fpm
sed -i 's/user = apache/user = nginx/g' /etc/php-fpm.d/www.conf
sed -i 's/group = apache/group = nginx/g' /etc/php-fpm.d/www.conf
sed -i 's/pm = dynamic/pm = ondemand/g' /etc/php-fpm.d/www.conf
sed -i 's/max_execution_time = 30/max_execution_time = 300/g' /etc/php.ini
sed -i 's/max_input_time = 60/max_input_time = 300/g' /etc/php.ini
sed -i 's/memory_limit = 128M/memory_limit = 256M/g' /etc/php.ini
sed -i 's/post_max_size = 8M/post_max_size = 32M/g' /etc/php.ini
sed -i 's/post_max_size = 8M/post_max_size = 32M/g' /etc/php.ini
wget https://raw.githubusercontent.com/Ahrimaan/CDK-Examples/main/piwigo_infra_wo_lb/res/nginx.conf_ -P /etc/nginx/
mv /etc/nginx/nginx.conf_ /etc/nginx/nginx.conf
wget https://piwigo.org/download/dlcounter.php?code=netinstall -P /usr/share/nginx/html/
mv /usr/share/nginx/html/dlcounter.php\?code\=netinstall /usr/share/nginx/html/netinstall.php
chmod 777 /usr/share/nginx/html/
systemctl restart php-fpm
systemctl restart nginx