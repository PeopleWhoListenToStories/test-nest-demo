# xl-online-editing-server

## docker 部署 执行脚本

> 请在此输入您想执行的脚本

```shell

#删除上一次构建的镜像
docker stop be-wine-friend || true
# docker stop be-wine-friend-nginx || true
docker rm be-wine-friend || true
# docker rm be-wine-friend-nginx || true
docker rmi be-wine-friend-image || true
# docker rmi be-wine-friend-nginx-image || true


#打包构建
docker build -f Dockerfile . -t be-wine-friend-image

# 运行容器
docker-compose -f docker-compose.yml up -d
```
