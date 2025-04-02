import fs from 'fs/promises';
import path from 'path';

// Claude 설정 파일 경로
const CLAUDE_CONFIG_PATH = 'C:\\Users\\dydgu\\AppData\\Roaming\\Claude\\claude_desktop_config.json';

// 메모리 파일은 원래 위치 그대로 사용
const MEMORY_PATH = 'C:\\Users\\dydgu\\Desktop\\MCP-Tools\\node_modules\\@modelcontextprotocol\\server-memory\\dist\\memory.json';

// 이전에 사용했던 복사본 위치들 (삭제 대상)
const OLD_MEMORY_PATHS = [
  'C:\\Users\\dydgu\\Desktop\\memory.json',
  'C:\\Users\\dydgu\\Desktop\\MCP-Tools\\memory.json'
];

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

    // 이전 복사본 파일 삭제
    console.log('이전 메모리 복사본 파일 삭제 중...');
    for (const oldPath of OLD_MEMORY_PATHS) {
      try {
        const exists = await fileExists(oldPath);
        if (exists) {
          await fs.unlink(oldPath);
          console.log(`삭제 완료: ${oldPath}`);
        } else {
          console.log(`파일이 존재하지 않음: ${oldPath}`);
        }
      } catch (error) {
        console.error(`파일 삭제 중 오류 발생: ${oldPath}`, error);
      }
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
      "// memory.json 파일 경로를 원래 경로 그대로 사용하여 데이터 복제 없이 동일한 파일 공유.\n" + 
      `// 메모리 경로: ${MEMORY_PATH}\n` +
      "// 이전에 생성된 복사본 파일들은 삭제되었습니다.\n" +
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