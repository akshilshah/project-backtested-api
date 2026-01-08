cd /home/ubuntu/crypto

# download the env file
current_env=`cat /etc/backtestedagent/env`
sudo -u ubuntu /home/ubuntu/.local/bin/aws s3 cp s3://goswirl-configs/$current_env/$current_env.crypto.env .env

# link the shared node_modules
ln -s /home/ubuntu/shared/crypto/node_modules node_modules

yarn
echo "Applying migrations"

yarn db:migrate:apply

checker=$?
if [ "$checker" -ne "0" ]; then
    exit $checker
fi

yarn db:generate
checker=$?
if [ "$checker" -ne "0" ]; then
    exit $checker
fi

yarn build
