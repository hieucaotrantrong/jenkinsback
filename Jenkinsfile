pipeline {
  agent any

  environment {
    DOCKER_USER    = "hieusenior1010"   
    BACKEND_IMAGE  = "backend"
    FRONTEND_IMAGE = "frontend"
    DEPLOY_DIR     = "/opt/deploy/app"
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
            url: 'https://github.com/hieucaotrantrong/jenkinsback.git', // TODO: sửa
            credentialsId: 'github-pat'
          ]]
        ])
      }
    }

    stage('Build Backend Docker') {
      steps {
        sh """
          docker build \
            -t docker.io/${DOCKER_USER}/${BACKEND_IMAGE}:latest \
            -f backend/backend.Dockerfile .
        """
      }
    }

    stage('Build Frontend Docker') {
      steps {
        sh """
          docker build \
            -t docker.io/${DOCKER_USER}/${FRONTEND_IMAGE}:latest \
            -f frontend/Dockerfile .
        """
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

    stage('Deploy (same host)') {
      steps {
        // đảm bảo compose có bản mới nhất
        sh """
          mkdir -p ${DEPLOY_DIR}
        """
        // docker-compose.yml đã đặt sẵn ở /opt/deploy/app theo bước 1.3
        sh """
          cd ${DEPLOY_DIR} && \
          docker compose pull && \
          docker compose up -d && \
          docker image prune -f
        """
      }
    }
  }
}
