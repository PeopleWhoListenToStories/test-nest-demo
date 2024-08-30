# slaykit-server

## docker 部署 执行脚本

> 请在此输入您想执行的脚本

```shell

#删除上一次构建的镜像
docker stop slaykit-server || true
# docker stop slaykit-server-nginx || true
docker rm slaykit-server || true
# docker rm slaykit-server-nginx || true
docker rmi slaykit-server-image || true
# docker rmi slaykit-server-nginx-image || true

#打包构建
docker build -f Dockerfile . -t slaykit-server

# 运行容器
docker-compose -f docker-compose.yml up -d
```
