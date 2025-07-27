import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task } from '@/types';

// Define TeamMember interface locally if not available from '@/types'
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  // Add other fields as needed
}

export interface DiagnosticResult {
  userId: string;
  userTeams: string[];
  teamMemberships: TeamMember[];
  teamTaskCounts: Record<string, number>;
  permissionErrors: string[];
  inconsistencies: string[];
}

export async function runFirestoreDiagnostics(userId: string): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    userId,
    userTeams: [],
    teamMemberships: [],
    teamTaskCounts: {},
    permissionErrors: [],
    inconsistencies: []
  };

  try {
    console.log('🔍 Running Firestore diagnostics for user:', userId);

    // Check user's team memberships
    const membershipsQuery = query(
      collection(db, 'teamMembers'),
      where('userId', '==', userId)
    );
    
    const membershipsSnapshot = await getDocs(membershipsQuery);
    result.teamMemberships = membershipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TeamMember));

    result.userTeams = result.teamMemberships.map(member => member.teamId);
    console.log('👥 User belongs to teams:', result.userTeams);

    // Check task counts for each team
    for (const teamId of result.userTeams) {
      try {
        const teamTasksQuery = query(
          collection(db, 'tasks'),
          where('teamId', '==', teamId)
        );
        
        const teamTasksSnapshot = await getDocs(teamTasksQuery);
        result.teamTaskCounts[teamId] = teamTasksSnapshot.size;
        console.log(`📊 Team ${teamId} has ${teamTasksSnapshot.size} tasks`);
      } catch (error: any) {
        const errorMessage = `Failed to count tasks for team ${teamId}: ${error.message}`;
        result.permissionErrors.push(errorMessage);
        console.error('❌', errorMessage);
      }
    }

    // Check for inconsistencies
    if (result.userTeams.length === 0) {
      result.inconsistencies.push('User is not a member of any teams');
    }

    // Verify team documents exist
    for (const teamId of result.userTeams) {
      try {
        const teamDoc = await getDoc(doc(db, 'teams', teamId));
        if (!teamDoc.exists()) {
          result.inconsistencies.push(`Team document ${teamId} does not exist`);
        }
      } catch (error: any) {
        result.inconsistencies.push(`Cannot access team document ${teamId}: ${error.message}`);
      }
    }

    console.log('✅ Diagnostics completed:', {
      teamsCount: result.userTeams.length,
      totalTasks: Object.values(result.teamTaskCounts).reduce((sum, count) => sum + count, 0),
      permissionErrors: result.permissionErrors.length,
      inconsistencies: result.inconsistencies.length
    });

  } catch (error: any) {
    console.error('💥 Diagnostics failed:', error.message);
    result.permissionErrors.push(`Diagnostics failed: ${error.message}`);
  }

  return result;
}

export function logDiagnosticResults(results: DiagnosticResult): void {
  console.group('📋 Firestore Diagnostics Results');
  console.log('User ID:', results.userId);
  console.log('Teams:', results.userTeams);
  console.log('Team memberships:', results.teamMemberships);
  console.log('Task counts by team:', results.teamTaskCounts);
  
  if (results.permissionErrors.length > 0) {
    console.warn('Permission errors:', results.permissionErrors);
  }
  
  if (results.inconsistencies.length > 0) {
    console.warn('Inconsistencies found:', results.inconsistencies);
  }
  
  console.groupEnd();
}
