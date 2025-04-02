# Claude-GPT Memory API

REST API 서버로 Claude와 GPTs 간 메모리(지식 그래프) 공유를 가능하게 합니다.

## 기능

- Claude 메모리 MCP 서버와 동일한 지식 그래프 구조 및 기능 제공
- REST API를 통한 메모리 액세스 (claude-gpt-memory-api)
- GPTs 및 Claude 모두 접근 가능한 공통 메모리 저장소

## 설치

1. 저장소 클론하기:

```bash
git clone https://github.com/na06078/claude-gpt-memory-api.git
cd claude-gpt-memory-api
```

2. 의존성 설치:

```bash
npm install
```

3. 환경 변수 설정:

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 `MEMORY_FILE_PATH`를 설정합니다. 
Claude와 메모리를 공유하려면 Claude 설정의 메모리 파일 경로를 사용합니다.

## 사용법

### 서버 시작

```bash
npm start
```

서버는 기본적으로 http://localhost:3030 에서 실행됩니다.

## API 엔드포인트

서버는 다음과 같은 엔드포인트를 제공합니다:

- `GET /api/graph`: 전체 지식 그래프 불러오기
- `POST /api/entities`: 새 엔티티 생성
- `POST /api/relations`: 새 관계 생성
- `POST /api/observations`: 엔티티에 관찰 추가
- `DELETE /api/entities`: 엔티티 삭제
- `DELETE /api/observations`: 관찰 삭제
- `DELETE /api/relations`: 관계 삭제
- `GET /api/search?query=검색어`: 지식 그래프 검색
- `GET /api/nodes?names=이름1,이름2`: 특정 노드 불러오기

## Claude 설정 변경

Claude 앱 설정에서 메모리 서버가 이 API 서버와 동일한 메모리 파일을 사용하도록 설정합니다:

1. Claude 데스크톱 앱 설정 파일을 엽니다: `C:\\Users\\dydgu\\AppData\\Roaming\\Claude\\claude_desktop_config.json`
2. memory 서버 설정의 `MEMORY_FILE_PATH` 환경 변수가 API 서버와 동일한 경로를 가리키는지 확인합니다.

## GPTs 설정

1. OpenAI GPTs에서 "Actions" 기능을 사용하여 API 서버 엔드포인트에 연결합니다.
2. 엔드포인트의 URL과 사용 방법을 스키마에 맞게 구성합니다.

## 샘플 API 요청

### 지식 그래프 조회

```bash
curl http://localhost:3030/api/graph
```

### 엔티티 생성

```bash
curl -X POST http://localhost:3030/api/entities -H "Content-Type: application/json" -d '{
  "entities": [
    {
      "name": "test_entity",
      "entityType": "person",
      "observations": ["This is a test entity"]
    }
  ]
}'
```

### 검색

```bash
curl http://localhost:3030/api/search?query=test
```

## 라이센스

MIT

## 참고 자료

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) - Claude API에서 사용하는 프로토콜
- [Claude Desktop App](https://claude.ai/downloads)