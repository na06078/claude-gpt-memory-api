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

### Claude 설정 업데이트

먼저 Claude 설정을 업데이트하여 메모리 파일 경로를 `C:\Users\dydgu\Desktop\MCP-Tools\memory.json`으로
변경합니다:

```bash
node setup-claude-memory.js
```

이 스크립트는 다음 작업을 수행합니다:
1. Claude 설정 파일의 백업 생성
2. 기존 메모리 파일을 새 위치로 복사
3. Claude의 메모리 서버 설정 업데이트

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

## Claude 설정 확인

Claude의 설정 파일이 올바르게 설정되었는지 확인하세요:

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": [
        "C:\\Users\\dydgu\\Desktop\\MCP-Tools\\node_modules\\@modelcontextprotocol\\server-memory\\dist\\index.js"
      ],
      "env": {
        "MEMORY_FILE_PATH": "C:\\Users\\dydgu\\Desktop\\MCP-Tools\\memory.json"
      }
    }
  }
}
```

## GPTs 설정

1. OpenAI GPTs에서 "Actions" 기능을 사용하여 API 서버 엔드포인트에 연결합니다.
2. openapi-schema.json 파일의 내용을 사용하여 스키마를 설정합니다.
3. 서버 URL을 액세스 가능한 주소로 설정합니다.

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