/**
 * DATABASE TESTING ENDPOINT
 * For testing and verifying DID-authentication linkage
 * WARNING: Remove this endpoint in production!
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const email = searchParams.get('email')
    const did = searchParams.get('did')
    const walletAddress = searchParams.get('wallet')

    const supabase = createClient(supabaseUrl, supabaseKey)

    switch (action) {
      case 'check-user':
        if (!email) {
          return NextResponse.json({ error: 'Email required for check-user' }, { status: 400 })
        }

        // Get user with authentication data
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email, wallet_address, did, auth_method, is_verified, created_at')
          .eq('email', email.toLowerCase())
          .single()

        if (userError) {
          return NextResponse.json({
            success: true,
            found: false,
            message: 'User not found',
            email
          })
        }

        // Get linked DID record
        const { data: didRecord, error: didError } = await supabase
          .from('dids')
          .select('*')
          .eq('wallet_address', user.wallet_address)
          .single()

        return NextResponse.json({
          success: true,
          found: true,
          user: {
            id: user.id,
            email: user.email,
            wallet_address: user.wallet_address,
            did: user.did,
            auth_method: user.auth_method,
            is_verified: user.is_verified,
            created_at: user.created_at,
            has_password: true, // Don't expose password hash
            has_totp: false // TODO: Check TOTP table when implemented
          },
          did_record: didRecord || null,
          linkage: {
            user_has_did: !!user.did,
            did_record_exists: !!didRecord,
            wallet_addresses_match: didRecord ? didRecord.wallet_address === user.wallet_address : false,
            did_values_match: didRecord ? didRecord.did === user.did : false
          }
        })

      case 'check-did':
        if (!did) {
          return NextResponse.json({ error: 'DID required for check-did' }, { status: 400 })
        }

        // Find DID record
        const { data: didData, error: didFindError } = await supabase
          .from('dids')
          .select('*')
          .eq('did', did)
          .single()

        if (didFindError) {
          return NextResponse.json({
            success: true,
            found: false,
            message: 'DID not found in database',
            did
          })
        }

        // Find linked user
        const { data: linkedUser, error: linkedUserError } = await supabase
          .from('users')
          .select('id, email, wallet_address, did, auth_method, created_at')
          .eq('wallet_address', didData.wallet_address)
          .single()

        return NextResponse.json({
          success: true,
          found: true,
          did_record: didData,
          linked_user: linkedUser || null,
          linkage: {
            user_exists: !!linkedUser,
            wallet_addresses_match: linkedUser ? linkedUser.wallet_address === didData.wallet_address : false,
            did_values_match: linkedUser ? linkedUser.did === didData.did : false
          }
        })

      case 'check-wallet':
        if (!walletAddress) {
          return NextResponse.json({ error: 'Wallet address required for check-wallet' }, { status: 400 })
        }

        // Get both user and DID records for wallet
        const [userResult, didResult] = await Promise.all([
          supabase
            .from('users')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single(),
          supabase
            .from('dids')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single()
        ])

        return NextResponse.json({
          success: true,
          wallet_address: walletAddress,
          user_record: userResult.data || null,
          user_error: userResult.error?.message || null,
          did_record: didResult.data || null,
          did_error: didResult.error?.message || null,
          summary: {
            has_user_record: !!userResult.data,
            has_did_record: !!didResult.data,
            records_linked: !!(userResult.data && didResult.data),
            did_values_match: userResult.data && didResult.data ? 
              userResult.data.did === didResult.data.did : false
          }
        })

      case 'list-recent':
        // Get recent users and DIDs
        const [recentUsers, recentDids] = await Promise.all([
          supabase
            .from('users')
            .select('id, email, wallet_address, did, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('dids')
            .select('id, did, wallet_address, created_at')
            .order('created_at', { ascending: false })
            .limit(10)
        ])

        return NextResponse.json({
          success: true,
          recent_users: recentUsers.data || [],
          recent_dids: recentDids.data || [],
          user_count: recentUsers.data?.length || 0,
          did_count: recentDids.data?.length || 0
        })

      default:
        return NextResponse.json({
          success: true,
          message: 'Database testing endpoint',
          available_actions: [
            'check-user?email=test@example.com',
            'check-did?did=did:persona:...',
            'check-wallet?wallet=persona1...',
            'list-recent'
          ]
        })
    }

  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Database test failed'
    }, { status: 500 })
  }
}

// Also support POST for testing
export async function POST(request: NextRequest) {
  return GET(request)
}