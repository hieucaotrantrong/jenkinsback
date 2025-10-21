pipeline {
  agent any

  environment {
    DOCKER_USER    = "hieusenior1010"   
    BACKEND_IMAGE  = "backend"
    FRONTEND_IMAGE = "frontend"
  }

  options {
    skipDefaultCheckout(true)
    timestamps()
    ansiColor('xterm')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout([$class: 'GitSCM',
          branches: [[name: '*/main']],
          userRemoteConfigs: [[
            url: 'https://github.com/hieucaotrantrong/jenkinsback.git',
            credentialsId: 'github-pat'
          ]]
        ])
      }
    }

    stage('Build Backend Docker') {
      steps {
        sh "docker build -t docker.io/${DOCKER_USER}/${BACKEND_IMAGE}:latest -f backend/backend.Dockerfile ."
      }
    }

    stage('Build Frontend Docker') {
      steps {
        sh "docker build -t docker.io/${DOCKER_USER}/${FRONTEND_IMAGE}:latest -f frontend/Dockerfile ."
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-cred', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
          sh """
            echo \$PASS | docker login -u \$USER --password-stdin
            docker push docker.io/${DOCKER_USER}/${BACKEND_IMAGE}:latest
            docker push docker.io/${DOCKER_USER}/${FRONTEND_IMAGE}:latest
          """
        }
      }
    }

    stage('Deploy') {
      steps {
        script {
          // Dừng và xóa các container cũ nếu có
          sh 'docker stop backend frontend || true'
          sh 'docker rm backend frontend || true'
          
          // 1. TẠO MỘT MẠNG CHUNG
          sh 'docker network create my-app-network || true'

          // 2. CHẠY CONTAINER BACKEND
          // - Đặt tên là 'backend' (để Nginx tìm thấy)
          // - Nối vào mạng 'my-app-network'
          sh """
            docker run -d --name backend --network my-app-network \\
            docker.io/${DOCKER_USER}/${BACKEND_IMAGE}:latest
          """

          // 3. CHẠY CONTAINER FRONTEND
          // - Nối vào cùng mạng 'my-app-network'
          // - Mở cổng 80 để người dùng truy cập
          sh """
            docker run -d --name frontend -p 80:80 --network my-app-network \\
            docker.io/${DOCKER_USER}/${FRONTEND_IMAGE}:latest
          """
        }
      }
    }
  }
}
