import type { Formation, Player, Position, FieldType } from "@/lib/types"

// Định nghĩa vị trí chuẩn cho từng sơ đồ chiến thuật
const formationPositions: Record<Formation, Record<string, { x: number; y: number }>> = {
  "4-4-2": {
    GK: { x: 10, y: 50 },
    LB: { x: 20, y: 20 },
    CB1: { x: 20, y: 40 },
    CB2: { x: 20, y: 60 },
    RB: { x: 20, y: 80 },
    LM: { x: 40, y: 20 },
    CM1: { x: 40, y: 40 },
    CM2: { x: 40, y: 60 },
    RM: { x: 40, y: 80 },
    ST1: { x: 70, y: 40 },
    ST2: { x: 70, y: 60 },
  },
  "4-3-3": {
    GK: { x: 10, y: 50 },
    LB: { x: 20, y: 20 },
    CB1: { x: 20, y: 40 },
    CB2: { x: 20, y: 60 },
    RB: { x: 20, y: 80 },
    DMF: { x: 40, y: 30 },
    CMF1: { x: 40, y: 50 },
    CMF2: { x: 40, y: 70 },
    LWF: { x: 70, y: 20 },
    CF: { x: 70, y: 50 },
    RWF: { x: 70, y: 80 },
  },
  "3-5-2": {
    GK: { x: 10, y: 50 },
    CB1: { x: 20, y: 30 },
    CB2: { x: 20, y: 50 },
    CB3: { x: 20, y: 70 },
    LWB: { x: 35, y: 15 },
    DMF: { x: 40, y: 50 },
    RWB: { x: 35, y: 85 },
    CMF1: { x: 50, y: 30 },
    CMF2: { x: 50, y: 70 },
    ST1: { x: 70, y: 40 },
    ST2: { x: 70, y: 60 },
  },
  "5-3-2": {
    GK: { x: 10, y: 50 },
    LWB: { x: 20, y: 10 },
    CB1: { x: 20, y: 30 },
    CB2: { x: 20, y: 50 },
    CB3: { x: 20, y: 70 },
    RWB: { x: 20, y: 90 },
    CMF1: { x: 45, y: 30 },
    DMF: { x: 45, y: 50 },
    CMF2: { x: 45, y: 70 },
    ST1: { x: 70, y: 40 },
    ST2: { x: 70, y: 60 },
  },
  "4-2-3-1": {
    GK: { x: 10, y: 50 },
    LB: { x: 20, y: 20 },
    CB1: { x: 20, y: 40 },
    CB2: { x: 20, y: 60 },
    RB: { x: 20, y: 80 },
    DMF1: { x: 35, y: 40 },
    DMF2: { x: 35, y: 60 },
    LWF: { x: 55, y: 20 },
    AMF: { x: 55, y: 50 },
    RWF: { x: 55, y: 80 },
    CF: { x: 75, y: 50 },
  },
  "3-4-3": {
    GK: { x: 10, y: 50 },
    CB1: { x: 20, y: 30 },
    CB2: { x: 20, y: 50 },
    CB3: { x: 20, y: 70 },
    LM: { x: 40, y: 20 },
    CM1: { x: 40, y: 40 },
    CM2: { x: 40, y: 60 },
    RM: { x: 40, y: 80 },
    LWF: { x: 70, y: 20 },
    CF: { x: 70, y: 50 },
    RWF: { x: 70, y: 80 },
  },
}

// Ánh xạ vị trí cho đội khách (đảo ngược)
function mapAwayPosition(position: { x: number; y: number }): { x: number; y: number } {
  return {
    x: 100 - position.x,
    y: position.y,
  }
}

// Định nghĩa đội hình mặc định cho từng loại sân
const fieldTypeFormations: Record<FieldType, Formation[]> = {
  "5": ["3-1", "2-1-1", "2-2"],
  "7": ["3-2-1", "3-3", "2-3-1"],
  "11": ["4-4-2", "4-3-3", "3-5-2", "5-3-2", "4-2-3-1", "3-4-3"] as Formation[]
}

// Định nghĩa vị trí cho sân 5 người
const field5Positions: Record<string, Record<string, { x: number; y: number }>> = {
  "3-1": {
    GK: { x: 10, y: 50 },
    CB1: { x: 30, y: 30 },
    CB2: { x: 30, y: 50 },
    CB3: { x: 30, y: 70 },
    CMF: { x: 60, y: 50 },
    CF: { x: 80, y: 50 },
  },
  "2-1-1": {
    GK: { x: 10, y: 50 },
    CB1: { x: 30, y: 30 },
    CB2: { x: 30, y: 70 },
    CMF: { x: 60, y: 50 },
    CF1: { x: 80, y: 30 },
    CF2: { x: 80, y: 70 },
  },
  "2-2": {
    GK: { x: 10, y: 50 },
    CB1: { x: 30, y: 30 },
    CB2: { x: 30, y: 70 },
    CMF1: { x: 60, y: 30 },
    CMF2: { x: 60, y: 70 },
    CF: { x: 80, y: 50 },
  }
}

// Định nghĩa vị trí cho sân 7 người
const field7Positions: Record<string, Record<string, { x: number; y: number }>> = {
  "3-2-1": {
    GK: { x: 10, y: 50 },
    CB1: { x: 25, y: 30 },
    CB2: { x: 25, y: 50 },
    CB3: { x: 25, y: 70 },
    CMF1: { x: 50, y: 35 },
    CMF2: { x: 50, y: 65 },
    CF1: { x: 75, y: 35 },
    CF2: { x: 75, y: 65 },
  },
  "3-3": {
    GK: { x: 10, y: 50 },
    CB1: { x: 25, y: 30 },
    CB2: { x: 25, y: 50 },
    CB3: { x: 25, y: 70 },
    CMF1: { x: 50, y: 30 },
    CMF2: { x: 50, y: 50 },
    CMF3: { x: 50, y: 70 },
    CF: { x: 75, y: 50 },
  },
  "2-3-1": {
    GK: { x: 10, y: 50 },
    CB1: { x: 25, y: 35 },
    CB2: { x: 25, y: 65 },
    CMF1: { x: 50, y: 30 },
    CMF2: { x: 50, y: 50 },
    CMF3: { x: 50, y: 70 },
    CF1: { x: 75, y: 35 },
    CF2: { x: 75, y: 65 },
  }
}

// Lấy danh sách đội hình cho loại sân
export function getFormationsForFieldType(fieldType: FieldType): Formation[] {
  return fieldTypeFormations[fieldType];
}

// Lấy vị trí cho đội hình dựa trên loại sân
export function getPositionsForFormation(formation: Formation, fieldType: FieldType): Record<string, { x: number; y: number }> | undefined {
  if (fieldType === "5") {
    return field5Positions[formation as keyof typeof field5Positions];
  } else if (fieldType === "7") {
    return field7Positions[formation as keyof typeof field7Positions];
  } else {
    return formationPositions[formation as keyof typeof formationPositions];
  }
}

export function generatePlayersFromFormation(formation: Formation, teamColor: string, teamId: string, fieldType: FieldType = "11"): Player[] {
  const players: Player[] = []
  const prefix = teamId || "player"
  const isHome = teamId === "home"

  // Lấy vị trí dựa trên loại sân và đội hình
  let positions;
  if (fieldType === "5") {
    positions = field5Positions[formation as keyof typeof field5Positions];
  } else if (fieldType === "7") {
    positions = field7Positions[formation as keyof typeof field7Positions];
  } else {
    positions = formationPositions[formation as keyof typeof formationPositions];
  }

  // Xác định số lượng cầu thủ tối đa dựa trên loại sân
  const maxPlayers = fieldType === "5" ? 5 : fieldType === "7" ? 7 : 11;
  
  // Tạo cầu thủ dựa trên vị trí
  let playerNumber = 1;
  
  // Duyệt qua tất cả các vị trí trong đội hình đã chọn
  for (const [positionKey, position] of Object.entries(positions)) {
    // Kiểm tra số lượng cầu thủ đã đủ chưa
    if (players.length >= maxPlayers) break;
    // Xác định vị trí thực tế (GK, CB, etc.)
    let actualPosition: Position = "GK";
    if (positionKey === "GK") {
      actualPosition = "GK";
    } else if (positionKey.startsWith("CB")) {
      actualPosition = "CB";
    } else if (positionKey.startsWith("LB") || positionKey === "LWB") {
      actualPosition = "LB";
    } else if (positionKey.startsWith("RB") || positionKey === "RWB") {
      actualPosition = "RB";
    } else if (positionKey.startsWith("DMF")) {
      actualPosition = "DMF";
    } else if (positionKey.startsWith("CMF") || positionKey.startsWith("CM") || positionKey === "AMF") {
      actualPosition = "CMF";
    } else if (positionKey.startsWith("LWF") || positionKey.startsWith("LM")) {
      actualPosition = "LWF";
    } else if (positionKey.startsWith("RWF") || positionKey.startsWith("RM")) {
      actualPosition = "RWF";
    } else if (positionKey.startsWith("CF") || positionKey.startsWith("ST")) {
      actualPosition = "CF";
    }
    
    // Tạo tên hiển thị cho cầu thủ dựa vào vị trí
    let displayName = `Cầu thủ ${playerNumber}`;
    if (positionKey === "GK") {
      displayName = "Thủ môn";
    } else if (positionKey.startsWith("CB")) {
      displayName = `Trung vệ ${positionKey.replace("CB", "") || ""}`;
    } else if (positionKey === "LWB" || positionKey === "LB") {
      displayName = "Hậu vệ cánh trái";
    } else if (positionKey === "RWB" || positionKey === "RB") {
      displayName = "Hậu vệ cánh phải";
    } else if (positionKey.startsWith("DMF")) {
      displayName = "Tiền vệ phòng ngự";
    } else if (positionKey.startsWith("CMF") || positionKey.startsWith("CM")) {
      displayName = `Tiền vệ trung tâm ${positionKey.replace("CMF", "").replace("CM", "") || ""}`;
    } else if (positionKey === "AMF") {
      displayName = "Tiền vệ tấn công";
    } else if (positionKey === "LWF" || positionKey === "LM") {
      displayName = "Tiền đạo cánh trái";
    } else if (positionKey === "RWF" || positionKey === "RM") {
      displayName = "Tiền đạo cánh phải";
    } else if (positionKey === "CF") {
      displayName = "Tiền đạo trung tâm";
    } else if (positionKey.startsWith("ST")) {
      displayName = `Tiền đạo ${positionKey.replace("ST", "") || ""}`;
    }
    
    // Tạo cầu thủ mới
    players.push({
      id: `${prefix}-${playerNumber}`,
      position: actualPosition,
      name: displayName,
      color: teamColor,
      image: "",
      number: playerNumber,
      positionKey: positionKey,
    })
    
    playerNumber++;
  }
  
  // Đặt vị trí cho cầu thủ
  for (const player of players) {
    const positionKey = player.positionKey as string;
    const pos = positions[positionKey];
    
    if (pos) {
      // Đảo ngược vị trí cho đội khách
      const position = isHome ? pos : mapAwayPosition(pos);
      Object.assign(player, { x: position.x });
      Object.assign(player, { y: position.y });
    }
  }
  
  return players
}

// Hàm để lấy vị trí cầu thủ dựa trên sơ đồ và vị trí
export function getPlayerPositionByFormation(
  formation: Formation,
  positionKey: string,
  teamId: "home" | "away",
  fieldType: FieldType = "11",
): { x: number; y: number } {
  // Lấy vị trí dựa trên loại sân và đội hình
  let positions;
  if (fieldType === "5") {
    positions = field5Positions[formation as keyof typeof field5Positions];
  } else if (fieldType === "7") {
    positions = field7Positions[formation as keyof typeof field7Positions];
  } else {
    positions = formationPositions[formation as keyof typeof formationPositions];
  }
  
  const position = positions?.[positionKey]

  if (!position) {
    // Vị trí mặc định nếu không tìm thấy
    return teamId === "home" ? { x: 50, y: 50 } : { x: 450, y: 50 }
  }

  // Chuyển đổi từ phần trăm sang pixel (giả sử sân 500x500)
  const pixelPosition = {
    x: (position.x * 500) / 100,
    y: (position.y * 500) / 100,
  }

  // Đảo ngược vị trí cho đội khách
  if (teamId === "away") {
    return {
      x: 500 - pixelPosition.x, // Đảo ngược trục X
      y: pixelPosition.y
    };
  }
  
  return pixelPosition;
}
