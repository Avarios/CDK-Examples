sudo yum update -y
sudo yum install docker -y
sudo wget https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)
sudo mv docker-compose-$(uname -s)-$(uname -m) /usr/local/bin/docker-compose
sudo chmod -v +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
sudo systemctl enable docker.service
sudo systemctl start docker.service
sudo wget https://raw.githubusercontent.com/Avarios/CDK-Examples/main/piwigo_docker_simple/res/docker-compose.yaml -P /home/ec2-user/
sudo mkdir /home/ec2-user/piwigo
chmod 777 /home/ec2-user/piwigo
sudo docker-compose -f /home/ec2-user/docker-compose.yaml up -d