yum update -y
yum install docker -y
curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
chmod -v +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
chown root:docker /usr/local/bin/docker-compose
systemctl enable docker.service
systemctl start docker.service
wget https://raw.githubusercontent.com/Avarios/CDK-Examples/main/piwigo_docker_simple/res/docker-compose.yaml -P /home/ec2-user/
mkdir /home/ec2-user/piwigo
chmod 777 /home/ec2-user/piwigo
docker-compose -f /home/ec2-user/docker-compose.yaml up -d