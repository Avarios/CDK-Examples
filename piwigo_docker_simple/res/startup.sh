#!/bin/bash 
#getting instance
avzone=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
 
#getting available ebs  volume-id
ebsvolume=$(/var/awslogs/bin/aws ec2 describe-volumes --filters Name=tag-value,Values=project Name=tag-value,Values=environment Name=tag-value,Values=product Name=availability-zone,Values=`echo $abzone` --query 'Volumes[*].[VolumeId, State==`available`]' --output text  | grep True | awk '{print $1}' | head -n 1) 
#check if there are available ebs vloumes
 
if [ -n "$ebsvolume" ]; then 
#getting instance id
    
instanceid=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
#attaching ebs    
/var/awslogs/bin/aws ec2 attach-volume --volume-id `echo $ebsvolume` --instance-id `echo $instanceid` --device /dev/sda1
     
sleep 10    
fi

sudo yum update -y
sudo yum install docker -y
sudo wget https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)
sudo mv docker-compose-$(uname -s)-$(uname -m) /usr/local/bin/docker-compose
sudo chmod -v +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
sudo systemctl enable docker.service
sudo systemctl start docker.service
sudo wget https://raw.githubusercontent.com/Ahrimaan/CDK-Examples/main/lychee/res/docker-compose.yaml -P /home/ec2-user/
sudo mkfs -t xfs /dev/sda1
sudo mkdir /home/ec2-user/piwigo
sudo mount /dev/sda1 /home/ec2-user/piwigo
sudo docker-compose -f /home/ec2-user/docker-compose.yaml up -d