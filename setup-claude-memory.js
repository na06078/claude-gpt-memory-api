import fs from 'fs/promises';
import path from 'path';

// Claude 설정 파일 경로
const CLAUDE_CONFIG_PATH = 'C:\\Users\\dydgu\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
const MEMORY_PATH = 'C:\\Users\\dydgu\\Desktop\\MCP-Tools\\memory.json';

async function updateClaudeConfig() {
  try {
    console.log(`Claude 설정 파일 읽기: ${CLAUDE_CONFIG_PATH}`);
    const configExists = await fileExists(CLAUDE_CONFIG_PATH);
    if (!configExists) {
      console.error('Claude 설정 파일을 찾을 수 없습니다!');
      return;
    }

    // 백업 생성
    const backupPath = path.join(
      path.dirname(CLAUDE_CONFIG_PATH),
      '클로드 설정 백업',
      `claude_desktop_config_backup_${getTimestamp()}.json`
    );
    
    // 설정 읽기
    const configData = await fs.readFile(CLAUDE_CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    // 백업 생성
    await createDirectory(path.dirname(backupPath));
    await fs.writeFile(backupPath, configData);
    console.log(`백업 생성 완료: ${backupPath}`);

    // 기존 메모리 파일 복사하기
    try {
      const existingMemoryPath = 'C:\\Users\\dydgu\\Desktop\\MCP-Tools\\node_modules\\@modelcontextprotocol\\server-memory\\dist\\memory.json';
      const existingMemoryExists = await fileExists(existingMemoryPath);
      
      if (existingMemoryExists) {
        console.log(`기존 메모리 파일을 찾았습니다: ${existingMemoryPath}`);
        console.log(`새 위치로 복사합니다: ${MEMORY_PATH}`);
        
        const memoryData = await fs.readFile(existingMemoryPath, 'utf8');
        await fs.writeFile(MEMORY_PATH, memoryData);
        console.log('메모리 파일 복사 완료');
      } else {
        console.log(`기존 메모리 파일을 찾을 수 없습니다: ${existingMemoryPath}`);
        console.log('빈 메모리 파일을 생성합니다.');
        await fs.writeFile(MEMORY_PATH, '');
      }
    } catch (error) {
      console.error('메모리 파일 복사 중 오류 발생:', error);
    }

    // 메모리 서버 설정 확인 및 업데이트
    if (!config.mcpServers.memory) {
      console.log('메모리 서버 설정이 없습니다. 새로 추가합니다.');
      config.mcpServers.memory = {
        command: "node",
        args: [
          "C:\\Users\\dydgu\\Desktop\\MCP-Tools\\node_modules\\@modelcontextprotocol\\server-memory\\dist\\index.js"
        ],
        env: {
          MEMORY_FILE_PATH: MEMORY_PATH
        }
      };
    } else {
      console.log('기존 메모리 서버 설정을 업데이트합니다.');
      config.mcpServers.memory.env = {
        ...config.mcpServers.memory.env,
        MEMORY_FILE_PATH: MEMORY_PATH
      };
    }

    // 설정 업데이트
    await fs.writeFile(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2));

    // 주석 추가된 백업 파일 생성
    const commentedConfig = JSON.stringify(config, null, 2) + 
      `\n// 생성된 정확한 날짜와 시간: ${new Date().toISOString()} \n` +
      "// 무슨 작업을 위해 백업을 하는지: \n" +
      "// Claude와 GPTs 간 메모리 공유를 위한 설정 업데이트입니다.\n" +
      "// memory.json 파일 경로를 C:\\Users\\dydgu\\Desktop\\MCP-Tools\\memory.json으로 변경하여\n" + 
      "// API 서버와 Claude가 같은 메모리 파일을 사용하도록 합니다.\n" +
      "// API 서버: https://github.com/na06078/claude-gpt-memory-api를 통해 GPTs에서도 같은 메모리에 접근 가능합니다.\n";
    
    await fs.writeFile(backupPath, commentedConfig);
    
    console.log('Claude 설정 업데이트 완료!');
    console.log(`메모리 파일 경로: ${MEMORY_PATH}`);
    console.log('이제 Claude를 재시작하고 API 서버를 시작하면 메모리가 공유됩니다.');
  } catch (error) {
    console.error('설정 업데이트 중 오류 발생:', error);
  }
}

// 파일 존재 여부 확인 유틸리티 함수
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// 디렉토리 생성 유틸리티 함수
async function createDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// 타임스탬프 생성 유틸리티 함수
function getTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
}

// 스크립트 실행
updateClaudeConfig().catch(console.error);