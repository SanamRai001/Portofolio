import System from '../models/systemModel.js'
import { parseSystemConfigUpdate } from '../utils/systemConfigInput.js'

export const updateSystemConfig = async (req, res) => {
  const parsed = parseSystemConfigUpdate(req.body)

  if (!parsed.ok) {
    return res.status(400).json({
      success: false,
      message: parsed.message,
    })
  }

  try {
    const updated = await System.findOneAndUpdate(
      {},
      {
        $set: {
          ...parsed.data,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )

    return res.json({
      success: true,
      message: 'System config updated',
      data: updated,
    })
  } catch (error) {
    console.error('System config update failed', error.message)
    return res.status(500).json({
      success: false,
      message: 'System config update failed',
    })
  }
}

export const readSystemConfig = async (_req, res) => {
  try {
    const config = await System.findOne()

    if (!config) {
      return res.status(500).json({
        success: false,
        message: 'System config missing',
      })
    }

    return res.json({
      success: true,
      message: 'System config fetched',
      data: config,
    })
  } catch (error) {
    console.error('System config read failed', error.message)
    return res.status(500).json({
      success: false,
      message: 'System config failed',
    })
  }
}
